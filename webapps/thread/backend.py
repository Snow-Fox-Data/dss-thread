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
import logging

sentry_sdk.init(
    "https://1eedab484f7149b1b63cfc1d67cdf69e@o1133579.ingest.sentry.io/6180261",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0
)


@app.route('/get-user')
def get_user():
    try:
        headers = dict(request.headers)
        # Get the auth info of the user performing the request
        auth_info = dataiku.api_client().get_auth_info_from_browser_headers(headers)
        
        # If the user's group is not TRUSTED_GROUP, raise an exception
        # if TRUSTED_GROUP not in auth_info["groups"] :
            # raise Exception("You do not belong here, go away")
        # else:
        
        if 'authIdentifier' in auth_info:
            dss = dss_utils()
            res = dss.get_collection_stats()

            data = {"status": "ok", "you_are": auth_info["authIdentifier"], "stats": res}
        else:
            data = {"status": "denied", "you_are": 'not logged in'}
    except:
        data = {"status": "denied", "you_are": 'not logged in'}

    return json.dumps(data)

@app.route('/init', methods=['GET'])
def init():
    return json.dumps({"result": "initialized"})

@app.route('/scan', methods=['GET'])
def scan():
    dss = dss_utils()

    dss.init_thread_ds(THREAD_DATASETS_NAME, 'thread_datasets.csv')
    dss.init_thread_ds(THREAD_INDEX_NAME, 'thread_indexes.csv')
    dss.init_thread_ds(THREAD_DEFINITIONS_NAME, 'thread_definitions.csv', False)

    result = dss.scan_server()

    return json.dumps({"result": "scan complete"})

@app.route('/tag-list', methods=['GET'])
def tag_list():
    dss = dss_utils()

    return json.dumps(dss.get_tag_list())

@app.route('/def-search', methods=['GET'])
def defintition_list():
    args = request.args
    
    df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
    result = df[df['name'].str.contains(args.get('term'), case=False)]
    result2 = df[df['description'].str.contains(args.get('term'), case=False)]
    result3 = df[df['tags'].str.contains(args.get('term'), case=False)]

    merged_df = pd.concat([result, result2, result3], ignore_index=True)
    merged_df.drop_duplicates(subset=['id'],inplace=True)

    merged_df['search_def'] = merged_df['name'] + ' | ' + merged_df['description']
    return merged_df.to_json(orient='records')

@app.route('/search', methods=['GET'])
def search():
    args = request.args
    dss = dss_utils()

    idx_ds = dss.get_index_ds()
    df = idx_ds.get_dataframe()

    result = df[df['description'].str.contains(args.get('term'), case=False)]
    
    return result.to_json(orient="records")

@app.route('/delete-definition', methods=['GET'])
def delete_definition():
    args = request.args
    id = int(args.get('id'))

    dss = dss_utils()
    dss.delete_definition(id)

    return json.dumps({'success':True})

@app.route('/load-item', methods=['GET'])
def load_item():
    # passing "key" as querystring param
    # load full info (including lineage) for project, dataset, column or definition
    # headers = dict(request.headers)
    # # Get the auth info of the user performing the request
    # auth_info = dataiku.api_client().get_auth_info_from_browser_headers(headers)
    
    # user = dataiku.api_client().get_user(auth_info["authIdentifier"])
    # client_as_user = user.get_client_as()

    args = request.args
    key = args.get('key')
    key = key.replace(' | ', '|')

    dss = dss_utils()

    idx_ds = dss.get_index_ds()
    df = idx_ds.get_dataframe()

    idx_df = df.query(f'key=="{key}"')
    if len(idx_df) == 0:
        logging.info(f'{key} not found')

    res = idx_df.iloc[0]
    if res['object_type'] == 'dataset':
        ds = dss.load_dataset(key, 'none')
        ds['object_type'] = 'dataset'

        col_ct, col_def = dss.calc_dataset_def_ct(key)
        ds['total_cols'] = col_ct
        ds['total_cols_def'] = col_def

        return json.dumps(ds)
    else:
        if res['object_type'] == 'project':
            p = dss.load_project(key)
            p['object_type'] = 'project'
            col_ct, col_def = dss.calc_project_def_ct(key)
            p['total_cols'] = col_ct
            p['total_cols_def'] = col_def

            return json.dumps(p)
        else:
            if res['object_type'] == 'column':
                try:
                    df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
                    search_key = re.escape(key)
                    def_df = df[df['applied_to'].str.contains(search_key, case=False, na=False)].fillna('')                    
                except Exception as e:
                    logging.info(e)
                    def_df = ''

                p_name, d_name, c_name = dss.extract_name_project(key)
                
                p = dss.load_dataset(p_name + '|' + d_name, c_name)
                col = next(item for item in p['schema'] if item["name"] == c_name)
                col['project'] = p_name
                col['dataset'] = d_name
                col['definition'] = { "id": -1}
                col['object_type'] = 'column'
                col['tag_list'] = dss.get_tag_list()

                if len(def_df) > 0:
                    col['definition'] = def_df.to_dict('records')[0]
                    
                return col
            if res['object_type'] == 'definition':
                # logging.info(f'searching for definition key: {key}')
                df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
                res = df.loc[df['id'] == int(key)].to_dict('records')[0]    
                res['object_type'] = 'definition'
               
    response_json = json.dumps(res) 
    # logging.info(response_json)

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
    tags = json.dumps(data['tags'])
    
    applied_to_json = json.dumps(data['applied_to'])

    desc_txt = ''
    if 'description' in data and len(data['description']) > 0:
        desc_txt = data['description']

    # remove old definition for this colimn
    if df is not None and ('column_key' in data):
        col_key = data['column_key']
        df = dss.reset_col_definition(df, col_key)

    # logging.info(desc_id, exists)
    index_ds = dss.get_index_ds()
    if desc_id == -1:
        new_id = random.randint(100000,100000000)
        # new description
        desc = {
            "id": new_id,
            "name": data['name'],
            "description": desc_txt,
            "applied_to": applied_to_json,
            "sources": [],
            "destinations":[],
            "tags": tags
        }

        if exists:
            df = df.append(desc, ignore_index=True)
        else:
            df = pd.DataFrame.from_dict([desc])

        new_record = pd.DataFrame.from_dict([{
                "name": data['name'],
                "description": data['name'] + ' | ' + desc_txt,
                "object_type": "definition",
                "key": new_id
            }])

        # todo: really don't like reading this whole dataset
        idx_df = index_ds.get_dataframe()
        idx_df = idx_df.append(new_record)

        index_ds.write_dataframe(idx_df)
            
    else:
        desc = {
            "id": desc_id,
            "name": data['name'],
            "description": desc_txt,
            "applied_to": applied_to_json,
            "sources": [],
            "destinations":[],
            "tags": tags
        }

        df.loc[df['id']==desc_id, 'name'] = desc['name']
        df.loc[df['id']==desc_id, 'description'] = desc['description']
        df.loc[df['id']==desc_id, 'applied_to'] = applied_to_json
        df.loc[df['id']==desc_id, 'tags'] = tags

        # update the name in the index
        idx_df = index_ds.get_dataframe()
        idx_df.loc[idx_df['key'] == str(desc_id), 'name'] = desc['name']
        index_ds.write_dataframe(idx_df)

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

    def init_thread_ds(self, name, location, overwrite=True):
        proj = self.client.get_default_project()

        ds_loc = location
        ds = proj.get_dataset(name)

        exists = ds.exists()
        if exists:
            if not overwrite:
                return
            
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

    # def dataset_project_shares(self, project_key):
    #     project = self.client.get_project(project_key)
    #     exposed = project.get_settings().settings['exposedObjects']['objects']
    #     exposed_ds = {}
    #     for e in exposed:
    #         if e['type'] == "DATASET":
    #             rules = e['rules']
    #             name = e['localName']
        
    #             shares = []
    #             for r in rules:
    #                 shares.append(r['targetProject'] + '|' + name)
            
    #             exposed_ds[name] = shares

    #     return exposed_ds

    def get_collection_stats(self):
        try:
            ds = dataiku.Dataset(THREAD_INDEX_NAME).get_dataframe()
            col_ct = len(ds.query('object_type=="column"'))
            dataset_ct = len(ds.query('object_type=="dataset"'))
            project_ct = len(ds.query('object_type=="project"'))
            def_ct = len(ds.query('object_type=="definition"'))

            return { "column_ct": col_ct, "dataset_ct": dataset_ct, "project_ct": project_ct, "definition_ct": def_ct}
        except:
            return { "column_ct": 0, "dataset_ct": 0, "project_ct": 0, "definition_ct": 0}

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
            tot_cols, def_cols = self.calc_dataset_def_ct(row['key'])
            p['datasets'].append({'key': row['key'],
            'total_columns': tot_cols, 'documented_columns': def_cols
            })

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
            logging.info(f'no schema for {key} {e}')

        # tags
        p = self.client.get_project(p_name)
        d = p.get_dataset(d_name)
        tags = d.get_metadata()['tags']         
        ds_type = d.get_settings().get_raw()['type']

        res = {
            "object_type": 'dataset',
            "ds_type": ds_type,
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
        df['applied_to'] = df['applied_to'].replace({f'["{col_name}"],': ''}).replace({f',["{col_name}"]': ''}).replace({f'["{col_name}"]': '[]'})  

        return df

    def calc_project_def_ct(self, proj_name):
        p = self.client.get_project(proj_name)
        datasets = p.list_datasets()

        total_ct = 0
        total_documented = 0
        for d in datasets:
            tot, doced = self.calc_dataset_def_ct(proj_name + '|' + d.id)
            total_ct += tot
            total_documented += doced

        return total_ct, total_documented

    def calc_dataset_def_ct(self, dataset_name):
        p, d, c = self.extract_name_project(dataset_name)
        p = self.client.get_project(p)
        ds = p.get_dataset(d)
        ds_schema = ds.get_schema()
        
        total_ct = len(ds_schema['columns'])
        defined_ct = 0
        for z in ds_schema['columns']: 
            # df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
            # search_key = re.escape(dataset_name + '|' + z['name'])
            # def_df = df[df['applied_to'].str.contains(search_key, case=False, na=False)].fillna('')  
            # if len(def_df) > 0:
            #     defined_ct = defined_ct + 1
            if 'comment' in z and len(z['comment']) > 0:
                defined_ct = defined_ct + 1

        return total_ct, defined_ct

    def update_column_description(self, column_array, description):
        if type(column_array)==str:
            column_array = [column_array]
            
        for i in column_array:
            if i is not None and len(i) > 0:
                logging.info(f'setting description for {i}')
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
                    # logging.info(col, ds['name'], ds[dir])
                    lin = self.get_col_lineage(col, ds[dir], upstream)

                    nxt.append({'name':obj['name'] + '|' + col, dir:lin})#
        
        return nxt
                    
    def get_stream(self, recipe, inputs_outputs, p_name):
        refs = []
        try:
            for j in recipe[inputs_outputs]:
                for i in range(len(recipe[inputs_outputs][j]['items'])):
                    name = recipe[inputs_outputs][j]['items'][i]['ref'].replace('.', '|', 1)
                    if '|' in name:
                        p_name, d_name, c_name = self.extract_name_project(name)
                    else:
                        d_name = name

                    try:
                        exist = dataiku.Dataset(d_name, p_name).get_location_info()
                        refs.append(self.get_full_dataset_name(d_name, p_name))
                    except: 
                        logging.info(f'{p_name}.{d_name} doesnt exist')
                        # doesn't exist, this is probably a folder or other item we don't currently support

        except Exception as e:
            capture_exception(e)
            
        if refs is None:
            return []

        return refs

    def get_tag_list(self):
        tags = []

        try:
            df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()

            for idx, row in df.iterrows():
                row_tags = json.loads(row['tags'])
                for t in row_tags:
                    if not t in tags:
                        tags.append(t)
        except:
            logging.info('error loading definitions - tags')

        return tags

    def get_ds_by_name(self, name, all_projects, p_name=None):
        # logging.info(name)
        if '|' in name:
            p_name, d_name, c_name = self.extract_name_project(name)
        else:
            d_name = name

        for i in range(len(all_projects[p_name]['datasets'])):
            ds = all_projects[p_name]['datasets'][i]
            if ds['name'] == d_name:
                return ds

        return None

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
            
            # if not 'ADVANCEDDESIGNERVM' in p:
            #     continue
            
            for r in project['recipes']:

                settings = r.to_recipe().get_settings()
                if 'PrepareRecipe' in str(type(settings)):
                    for step in settings.raw_steps:
                        if 'type' in step and step['type'] == 'ColumnRenamer' and step['disabled'] == False:
                            for renaming in step['params']['renamings']:
                                print(f'from: {renaming["from"]} to: {renaming["to"]}')
                
                ins = self.get_stream(r, 'inputs', p)            
                outs = self.get_stream(r, 'outputs', p)  
                
                r['ins'] = ins
                r['outs'] = outs

            for d in project['datasets']:
                d['lineage_downstream'] = []
                d['lineage_upstream'] = []
                full_nm = self.get_full_dataset_name(d['name'], d['projectKey'])

                d['full_name'] = full_nm
                d['project'] = p

                rec_name = full_nm 
                for r in project['recipes']:
                    if rec_name in r['ins']:
                        for o in r['outs']:
                            if not o in d['lineage_downstream']:
                                d['lineage_downstream'].append(o)
                    if rec_name in r['outs']:
                        for i in r['ins']:
                            if not i in d['lineage_upstream']:
                                d['lineage_upstream'].append(i)

        # add all shares
        for p in all_projects:
            project = all_projects[p]
            for d in range(len(project['datasets'])):
                ds = project['datasets'][d]

                for l in ds['lineage_upstream']:
                    if not p in l:
                        # this is a reference to a share
                        shared_dataset = self.get_ds_by_name(l, all_projects)
                        shared_dataset['lineage_downstream'].append(ds['full_name'])
                        logging.info(f'added shared dataset: {l} => {ds["full_name"]}')

        # get the full dataset lineage
        for p in all_projects:
            project = all_projects[p]
            for d in range(len(project['datasets'])):
                ds = project['datasets'][d]

                if 'lineage_upstream' in ds:
                    result_up = self.traverse_lineage(ds['full_name'], 'lineage_upstream', all_projects)
                    ds['lineage_upstream_full'] = result_up
        
                if 'lineage_downstream' in ds:
                    result_down = self.traverse_lineage(ds['full_name'], 'lineage_downstream', all_projects)
                    ds['lineage_downstream_full'] = result_down                       
                        
    def traverse_lineage(self, ds_name, dir, all_projects, recur_ct = 0):
        ds = self.get_ds_by_name(ds_name, all_projects)
        
        full = dir + '_full'
        try:
            if not full in ds:
                if dir in ds:
                    lins = []
                    for node in ds[dir]:
                        recur_ct = recur_ct + 1
                        if recur_ct > 200:
                            logging.info(f'recursive error {dir} - {ds_name}, {ds[dir]}')
                            return []

                        if node != ds_name:
                            lin = self.traverse_lineage(node, dir, all_projects, recur_ct)
                            lins.append({'name': node, dir:lin})

                    ds[full] = lins
                    
                    return lins
                else:
                    return []        
            else:
                return ds[full]
        except:
            logging.info(f'error traversing {ds_name}')
        
    def get_datasets_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_DATASETS_NAME)

        return proj_dataset

    def get_index_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_INDEX_NAME)

        return proj_dataset

    def delete_definition(self, id):
        ds = dataiku.Dataset(THREAD_DEFINITIONS_NAME)
        
        df = ds.get_dataframe()
        df = df.drop(df[df.id==id].index)

        ds.write_dataframe(df)

    def scan_server(self):
        project_list = []
        index_list = []
        scan_obj = {}

        dss_projects = self.client.list_project_keys()
        for proj in dss_projects:
            scan_obj[proj] = {}
            project = self.client.get_project(proj)
            proj_meta = project.get_metadata()
            
            datasets = project.list_datasets()
            recipes = project.list_recipes()
            folders = project.list_managed_folders()

            scan_obj[proj]['datasets'] = datasets
            scan_obj[proj]['recipes'] = recipes
            scan_obj[proj]['folders'] = folders

            index_list.append({
                "name": proj.replace('|', ' | '), 
                "object_type": "project",
                "key": proj,
                "description": proj_meta['label'] + '(' + proj.replace('|', ' | ') + ')'
            })

            for dataset in datasets:
                index_list.append({
                    "name": dataset['name'],
                    "object_type": "dataset",
                    "key": self.get_full_dataset_name(dataset['name'], proj),
                    "description": dataset['name']
                })

                for column in dataset['schema']['columns']:
                   index_list.append({
                     "name": column['name'],
                     "description": column['name'],
                     "object_type": "column",
                    "key": self.get_full_dataset_name(dataset['name'], proj) + '|' + column['name']
                     }) 

        # compute the dataset lineage
        self.get_ds_lineage(scan_obj)

        # logging.info(scan_obj)
        
        ds_list = []
        # create an object to save 
        for p in scan_obj:
            datasets = scan_obj[p]['datasets']
            for ds in datasets:
                    obj = { "project": p, "name": ds.name, "key": self.get_full_dataset_name(ds.name, p)}
                    if 'lineage_downstream' in ds:
                        obj['lineage_downstream'] = json.dumps(ds['lineage_downstream_full']) 
                        obj['lineage_downstream_l1'] = json.dumps(ds['lineage_downstream']) 
                    else:
                        obj['lineage_downstream'] = []
                    if 'lineage_upstream' in ds:
                        obj['lineage_upstream'] = json.dumps(ds['lineage_upstream_full'])
                        obj['lineage_upstream_l1'] = json.dumps(ds['lineage_upstream'])
                    else:
                        obj['lineage_upstream'] = []
                        
                    ds_list.append(obj)

        # add definitions to index
        try:
            df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
            df.fillna('', inplace=True)
            for idx, row in df.iterrows():
                index_list.append({
                        "name": row['name'],
                        "object_type": "definition",
                        "key": row['id'],
                        "description": row['name'] + ' | ' + row['description']
                    })
        except:
            logging.info('error indexing definitions')

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