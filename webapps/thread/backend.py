from ctypes import util
from dis import disassemble
import json
import dataiku
import pandas as pd
from flask import request
import numpy as np
import ast
import sentry_sdk
import random
from sentry_sdk import capture_exception
from sentry_sdk import capture_message
import re

sentry_sdk.init(
    "https://1eedab484f7149b1b63cfc1d67cdf69e@o1133579.ingest.sentry.io/6180261",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0
)


@app.route('/get-user')
def get_user():
    headers = dict(request.headers)
    # Get the auth info of the user performing the request
    auth_info = dataiku.api_client().get_auth_info_from_browser_headers(headers)
    print ("User doing the query is %s" % auth_info["authIdentifier"])
    # If the user's group is not TRUSTED_GROUP, raise an exception
    # if TRUSTED_GROUP not in auth_info["groups"] :
        # raise Exception("You do not belong here, go away")
    # else:
    data = {"status": "ok", "you_are": auth_info["authIdentifier"]}

    return json.dumps(data)


@app.route('/init', methods=['GET'])
def init():
    return json.dumps({"result": "initialized"})

@app.route('/scan', methods=['GET'])
def scan():
    dss = dss_utils()

    dss.init_thread_ds(THREAD_DATASETS_NAME, 'thread_datasets.csv')
    dss.init_thread_ds(THREAD_INDEX_NAME, 'thread_indexes.csv')
    dss.init_thread_ds(THREAD_DEFINITIONS_NAME, 'thread_descriptions.csv')

    result = dss.scan_server()

    return json.dumps({"result": "scan complete"})

@app.route('/def-search', methods=['GET'])
def defintition_list():
    args = request.args
    
    df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
    result = df[df['name'].str.contains(args.get('term'), case=False)]
    result2 = df[df['description'].str.contains(args.get('term'), case=False)]

    merged_df = pd.concat([result, result2], ignore_index=True)

    merged_df['search_def'] = merged_df['name'] + ' | ' + merged_df['description']
    return merged_df.to_json(orient='records')

@app.route('/search', methods=['GET'])
def search():
    args = request.args
    dss = dss_utils()

    idx_ds = dss.get_index_ds()
    df = idx_ds.get_dataframe()

    result = df[df['name'].str.contains(args.get('term'), case=False)]
    
    return result.to_json(orient="records")

@app.route('/load-item', methods=['GET'])
def load_item():
    # passing "key" as querystring param
    # load full info (including lineage) for project, dataset, column or definition
    args = request.args
    key = args.get('key')
    key = key.replace(' | ', '|')

    dss = dss_utils()

    idx_ds = dss.get_index_ds()
    df = idx_ds.get_dataframe()

    res = df.query(f'key=="{key}"').iloc[0]
    if res['object_type'] == 'dataset':
        ds = dss.load_dataset(key, 'none')

        return json.dumps(ds)
    else:
        if res['object_type'] == 'project':
            p = dss.load_project(key)

            return json.dumps(p)
        else:
            if res['object_type'] == 'column':
                try:
                    df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
                    search_key = re.escape(key)
                    def_df = df[df['applied_to'].str.contains(search_key, case=False, na=False)].fillna('')                    
                except Exception as e:
                    print(e)
                    def_df = ''

                p_name, d_name, c_name = dss.extract_name_project(key)
                print(f'loading col: {key}, {c_name}')
                p = dss.load_dataset(p_name + '|' + d_name, c_name)
                col = next(item for item in p['schema'] if item["name"] == c_name)
                col['project'] = p_name
                col['dataset'] = d_name
                col['definition'] = { "id": -1}

                if len(def_df) > 0:
                    col['definition'] = def_df.to_dict('records')[0]

                return col

    response_json = json.dumps(res) 
    # print(response_json)

    return response_json

@app.route('/update-desc', methods=['POST'])
def update_desc():
    dss = dss_utils()
    df = None

    try:
        desc_ds = dataiku.Dataset(THREAD_DEFINITIONS_NAME)
        exists = len(desc_ds.read_schema(raise_if_empty=False)) > 0

        if exists:
            df = desc_ds.get_dataframe()
    except:
        exists = False
    
    data = request.json
    desc_id = int(data['id'])
    col_key = data['column_key']
    applied_to_json = json.dumps(data['applied_to'])

    # remove old definition for this colimn
    if df is not None:
        df = dss.reset_col_definition(df, col_key)

    # print(desc_id, exists)
    if desc_id == -1:
        new_id = random.randint(100000,100000000)
        # new description
        desc = {
            "id": new_id,
            "name": data['name'],
            "description": data['description'],
            "applied_to": applied_to_json,
            "sources": [],
            "destinations":[]
        }

        if exists:
            df = df.append(desc, ignore_index=True)
        else:
            df = pd.DataFrame.from_dict([desc])

        index_ds = dss.get_index_ds()
        new_record = pd.DataFrame.from_dict([{
                "name": data['name'],
                "object_type": "definition",
                "key": new_id
            }])

        # todo: really don't like reading this whole dataset
        idx_df = index_ds.get_dataframe()
        idx_df = idx_df.append(new_record)

        index_ds.write_dataset(idx_df)
            
    else:
        desc = {
            "id": desc_id,
            "name": data['name'],
            "description": data['description'],
            "applied_to": applied_to_json,
            "sources": [],
            "destinations":[]
        }

        df.loc[df['id']==desc_id, 'name'] = desc['name']
        df.loc[df['id']==desc_id, 'description'] = desc['description']
        df.loc[df['id']==desc_id, 'applied_to'] = applied_to_json

    desc_ds.write_dataframe(df, infer_schema=True, dropAndCreate=True)

    if len(data['applied_to']) > 0:
        dss.update_column_description(data['applied_to'], data['description'])
     
    return json.dumps({"success": True,
        "value": desc
    })


THREAD_DEFINITIONS_NAME = '--Thread-Definitions--'
THREAD_DATASETS_NAME = '--Thread-Datasets--'
THREAD_INDEX_NAME = '--Thread-Index--'

class dss_utils:

    def __init__(self):
        self.client = dataiku.api_client()
        # self.init_description_dataset()

    def init_thread_ds(self, name, location):
        proj = self.client.get_default_project()

        ds_loc = location
        ds = proj.get_dataset(name)

        exists = ds.exists()
        if exists:
            ds.delete(drop_data=True)
            
        project_variables = dataiku.get_custom_variables()

        params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
        format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

        csv_dataset = proj.create_dataset(name, type='Filesystem', params=params,
                                            formatType='csv', formatParams=format_params)

        # Set dataset to managed
        ds_def = csv_dataset.get_definition()
        ds_def['managed'] = True
        csv_dataset.set_definition(ds_def)

        ds2 = dataiku.Dataset(name)
        df = pd.DataFrame()

        ds2.write_dataframe(df) 

        return ds2

    def load_project(self, key):
        proj = self.client.get_project(key)
        p = proj.get_summary()

        ds = dataiku.Dataset(THREAD_DATASETS_NAME)
        datasets = ds.get_dataframe().query(f'project=="{key}"')

        # get the project's folder
        folder = proj.get_project_folder().name
        if folder is None or len(folder) == 0:
            folder = 'root'

        p['folder'] = folder

        p['datasets'] = []
        for idx, row in datasets.iterrows():
            p['datasets'].append(row['key'])

        return p
   
    def load_dataset(self, key, col_lineage='none'):
        p_name, d_name, c_name = self.extract_name_project(key)
        ds = dataiku.Dataset(d_name, p_name)

        ds_ds = self.get_datasets_ds()
        rec = ds_ds.get_dataframe().query(f'key=="{key}"')

        lin_up = json.loads(rec.iloc[0]['lineage_upstream'])
        lin_down = json.loads(rec.iloc[0]['lineage_downstream'])

        schema = []
        try:
            schema = ds.read_schema()
            for col in schema:
                col['key'] = key + '|' + col['name']
                if col_lineage != 'none':
                    if col_lineage == 'all' or col['name'] == col_lineage:
                        col['lineage_upstream'] = self.get_col_lineage(col['name'], lin_up, True)
                        col['lineage_downstream'] = self.get_col_lineage(col['name'], lin_down, False)         
        except Exception as e:
            # capture_exception(e)
            print(f'no schema for {key} {e}')

        # tags
        p = self.client.get_project(p_name)
        d = p.get_dataset(d_name)
        tags = d.get_metadata()['tags']         

        res = {
            "object_type": 'dataset',
            "tags": tags,
            "schema": schema,
            "name": ds.full_name,
            "key": key,
            "id": d_name,
            "project": p_name,
            "meta": ds.read_metadata(),
            "lineage_upstream": lin_up,
            "lineage_downstream": lin_down
        }

        return res

    def reset_col_definition(self, df, col_name):
        df['applied_to'] = df['applied_to'].replace({f'["{col_name}"\'],': ''}).replace({f'["{col_name}"]': ''})  

        return df

    def update_column_description(self, column_array, description):
        if type(column_array)==str:
            column_array = [column_array]
            
        for i in column_array:
            print(f'setting description for {i}')
            lst = i.split('|')
            project, dataset, column = lst[0], lst[1], lst[2]
            p = self.client.get_project(project)
            ds = p.get_dataset(dataset)
            ds_schema = ds.get_schema()
            for z in ds_schema['columns']: 
                if z['name']==column:
                    z['comment']=description

            ds.set_schema(ds_schema)

    def get_col_lineage(self, col, ds_lineage_obj, upstream=False):
        dir = 'lineage_downstream'
        if upstream:
            dir = 'lineage_upstream'

        nxt = []

        for obj in ds_lineage_obj:
            ds = self.load_dataset(obj['name'], False)
            for column in ds['schema']:
                    
                if column['name'].lower() == col.lower():
                    # direct column name match!
                    # print(col, ds['name'], ds[dir])
                    lin = self.get_col_lineage(col, ds[dir], upstream)

                    nxt.append({'name':obj['name'] + '|' + col, dir:lin})#
        
        return nxt
                    
    def get_stream(self, recipe, inputs_outputs, p_name):
        refs = []
        try:
            for j in recipe[inputs_outputs]:
                for i in range(len(recipe[inputs_outputs][j]['items'])):
                    name = recipe[inputs_outputs][j]['items'][i]['ref']
                    if '|' in name:
                        p_name, d_name, c_name = self.extract_name_project(name)
                    else:
                        d_name = name

                    try:
                        exist = dataiku.Dataset(d_name, p_name).get_location_info()
                        refs.append(self.get_full_dataset_name(d_name, p_name))
                    except: 
                        print(f'{p_name}.{d_name} doesnt exist')
                        # doesn't exist, this is probably a folder or other item we don't currently support

        except Exception as e:
            capture_exception(e)
            
        if refs is None:
            return []

        return refs

    def get_ds_by_name(self, name, all_projects, p_name=None):
        # print(name)
        if '|' in name:
            p_name, d_name, c_name = self.extract_name_project(name)
        else:
            d_name = name

        for i in range(len(all_projects[p_name]['datasets'])):
            ds = all_projects[p_name]['datasets'][i]
            if ds['name'] == d_name:
                return ds

        return None
                
    def traverse_lineage(self, ds_name, all_projects, upstream=True, recur_ct = 0):
        try:
            ds = self.get_ds_by_name(ds_name, all_projects)

            next_levels = []
            if not ds is None:
                dir = 'lineage_upstream'
                if upstream == False:
                    dir = 'lineage_downstream'

                dir_full = dir + '_full'

                if (dir + '_complete') in ds:
                    return ds[dir_full]

                if dir in ds:
                    for l in ds[dir]:
                        try:
                            recur_ct = recur_ct + 1
                            if recur_ct > 300:
                                print(f'recursive error {dir} - {ds_name}, {l}, {ds[dir]}')
                                return []

                            nxt = self.traverse_lineage(l, all_projects, upstream, recur_ct)
                            next_levels.append({'name':l, dir: nxt})

                            ds[dir + '_complete'] = True
                            ds[dir_full] = nxt
                        except Exception as e:
                            capture_exception(e)
                
            return next_levels
                

        except Exception as e: 
            print(f'error traversing {ds_name}')
            return []

    def extract_name_project(self, full_ds_name):
        splits = full_ds_name.split('|')
        p_name = splits[0]
        d_name = splits[1]

        if len(splits) > 2:
            c_name = splits[2]
            return p_name, d_name, c_name

        return p_name, d_name, ''

    def get_full_dataset_name(self, name, project):
        return project + '|' + name

    def get_ds_lineage(self, all_projects):
        for p in all_projects:
            project = all_projects[p]
            
            for r in project['recipes']:
                ins = self.get_stream(r, 'inputs', p)            
                outs = self.get_stream(r, 'outputs', p)  
                
                r['ins'] = ins
                r['outs'] = outs

            for d in project['datasets']:
                d['lineage_downstream'] = []
                d['lineage_upstream'] = []
                
                for r in project['recipes']:
    #                 print(d['name'], r['ins'])
                    full_nm = self.get_full_dataset_name(d['name'], d['projectKey'])
                    if full_nm in r['ins']:
                        for o in r['outs']:
                            if not o in d['lineage_downstream']:
                                d['lineage_downstream'].append(o)
                    if full_nm in r['outs']:
                        for i in r['ins']:
                            if not i in d['lineage_upstream']:
                                d['lineage_upstream'].append(i)

        # get the full dataset lineage
        for p in all_projects:
            project = all_projects[p]
            for d in range(len(project['datasets'])):
                ds = project['datasets'][d]
                ds['full_name'] = self.get_full_dataset_name(ds['name'], p)

                if 'lineage_upstream' in ds:
                    result_up = self.traverse_lineage(ds['full_name'], all_projects, upstream=True)
                    ds['lineage_upstream_full'] = result_up
        
                if 'lineage_downstream' in ds:
                    result_down = self.traverse_lineage(ds['full_name'], all_projects, upstream=False)
                    ds['lineage_downstream_full'] = result_down

    def get_datasets_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_DATASETS_NAME)

        return proj_dataset

    def get_index_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_INDEX_NAME)

        return proj_dataset

    def scan_server(self):

        # root_folder = client.get_root_project_folder()
        # dss_folders = root_folder.list_child_folders()
        
        project_list = []
        index_list = []
        scan_obj = {}

        dss_projects = self.client.list_project_keys()
        for proj in dss_projects:
            # if 'VMCHURNPREDICTION' in proj.upper():
            scan_obj[proj] = {}

            # project_list.append(proj)

            # # print(proj)
            project = self.client.get_project(proj)
            
            datasets = project.list_datasets()
            recipes = project.list_recipes()
            folders = project.list_managed_folders()

            scan_obj[proj]['datasets'] = datasets
            scan_obj[proj]['recipes'] = recipes
            scan_obj[proj]['folders'] = folders

            index_list.append({
                "name": project.get_summary()['name'],
                "object_type": "project",
                "key": proj
            })

            for dataset in datasets:
                index_list.append({
                    "name": dataset['name'],
                    "object_type": "dataset",
                    "key": self.get_full_dataset_name(dataset['name'], proj)
                })

                for column in dataset['schema']['columns']:
                   index_list.append({
                     "name": column['name'],
                     "object_type": "column",
                    "key": self.get_full_dataset_name(dataset['name'], proj) + '|' + column['name']
                     }) 

        # print('start get lineage...')
        self.get_ds_lineage(scan_obj)
        # print('end get lineage')

        # print(json.dumps(scan_obj))

        ds_list = []
        for p in scan_obj:
            datasets = scan_obj[p]['datasets']
            for ds in datasets:
                    obj = { "project": p, "name": ds.name, "key": self.get_full_dataset_name(ds.name, p)}
                    if 'lineage_downstream' in ds:
                        obj['lineage_downstream'] = json.dumps(ds['lineage_downstream_full'])
                    else:
                        obj['lineage_downstream'] = []
                    if 'lineage_upstream' in ds:
                        obj['lineage_upstream'] = json.dumps(ds['lineage_upstream_full'])
                    else:
                        obj['lineage_upstream'] = []
                        
                    ds_list.append(obj)

        # add definitions to index
        # df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
        # for idx, row in df.iterrows():
        #     index_list.append({
        #             "name": row['name'],
        #             "object_type": "definition",
        #             "key": row['id']
        #         })

        # datasets dataset
        df = pd.DataFrame.from_dict(ds_list)
        df = df.astype({"lineage_upstream": str})
        df = df.astype({"lineage_downstream": str})
        
        proj_dataset = dataiku.Dataset(THREAD_DATASETS_NAME)
        proj_dataset.write_dataframe(df, infer_schema=True, dropAndCreate=True)

        # index dataset
        df2 = pd.DataFrame.from_dict(index_list)
        
        idx_ds = dataiku.Dataset(THREAD_INDEX_NAME)
        idx_ds.write_dataframe(df2, infer_schema=True, dropAndCreate=True)

        return True