from ctypes import util
from dis import disassemble
import json
import dataiku
import pandas as pd
from flask import request
import numpy as np
import ast
import sentry_sdk

sentry_sdk.init(
    "https://1eedab484f7149b1b63cfc1d67cdf69e@o1133579.ingest.sentry.io/6180261",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0
)

# @app.route('/getuser')
# def getuser():
#     usr = get_user()

#     return json.dumps({"user": usr})

@app.route('/init', methods=['GET'])
def init():
    return json.dumps({"result": "initialized"})

@app.route('/scan', methods=['GET'])
def scan():
    dss = dss_utils()

    proj_ds, f = dss.init_proj_dataset()
    index_ds = dss.init_index_dataset()

    result = dss.scan_server(proj_ds)

    return json.dumps({"result": "scan complete"})

@app.route('/search', methods=['GET'])
def search():
    args = request.args
    dss = dss_utils()

    idx_ds = dss.get_index_ds()
    df = idx_ds.get_dataframe()

    result = df[df['name'].str.contains(args.get('term'))]

    return result.to_json(orient="records")

@app.route('/load-item', methods=['GET'])
def load_item():
    # passing "key" as querystring param
    # load full info (including lineage) for project, dataset, column or definition
    args = request.args
    key = args.get('key')
    dss = dss_utils()

    idx_ds = dss.get_index_ds()
    df = idx_ds.get_dataframe()

    res = df.query(f'key=="{key}"').iloc[0]
    if res['type'] == 'dataset':
        ds = dss.load_dataset(key)

        return json.dumps(ds)
    else:
        if res['type'] == 'project':
            p = dss.load_project(key)

            return json.dumps(p)

    return json.dumps(res) 
    

@app.route('/update-col-desc', methods=['POST'])
def update_col_desc():
    # frm = request.form

    # print('POST!')
    # print(request.data)
    data = json.loads(request.data)
    # print(data['col'])

    cols = data['cols']
    desc = data['desc']

    # print(col, desc)

    # update the orig
    update_column_description(cols, description=desc)

    return json.dumps({
        'success': True
    })

@app.route('/column-lineage', methods=['POST'])
def column_lineage():
    data = json.loads(request.data)
    # dataset_name = data['dataset']
    # project = data['project']
    column = data['column']

    p, d, c = extract_name_project(column)

    # print(column)

    ups, downs = get_col_lineage(p, d, c)

    return json.dumps({
        'ups': ups,
        'downs': downs
    })

# def update_column_description(column_array, description):
#     if type(column_array)==str:
#         column_array = [column_array]
        
#     client = dataiku.api_client()
#     for i in column_array:
#         lst = i.split('.')
#         project, dataset, column = lst[0], lst[1], lst[2]
#         p = client.get_project(project)
#         ds = p.get_dataset(dataset)
#         ds_schema = ds.get_schema()
#         for z in ds_schema['columns']: 
#             if z['name']==column:
#                 z['comment']=description

#         ds.set_schema(ds_schema)






THREAD_DS_NAME = '--Thread-Descriptions--'
THREAD_DATASETS_NAME = '--Thread-Datasets--'
THREAD_INDEX_NAME = '--Thread-Index--'

class dss_utils:

    def __init__(self):
        self.client = dataiku.api_client()
        # self.init_description_dataset()

    def init_proj_dataset(self):
        proj = self.client.get_default_project()

        ds_loc = 'thread_datasets.csv'
        ds = proj.get_dataset(THREAD_DATASETS_NAME)

        exists = ds.exists()
        if exists:
            ds.delete(drop_data=True)
            
        project_variables = dataiku.get_custom_variables()

        params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
        format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

        csv_dataset = proj.create_dataset(THREAD_DATASETS_NAME, type='Filesystem', params=params,
                                            formatType='csv', formatParams=format_params)

        # Set dataset to managed
        ds_def = csv_dataset.get_definition()
        ds_def['managed'] = True
        csv_dataset.set_definition(ds_def)

        # Set schema
        csv_dataset.set_schema({'columns': [{'name': 'name', 'type':'string'}]})

        ds2 = dataiku.Dataset(THREAD_DATASETS_NAME)
        df = pd.DataFrame(columns=['key','lineage_downstream', 'lineage_upstream', 'name', 'project'])

        ds2.write_with_schema(df)

        return ds, False
    
    def init_index_dataset(self):
            proj = self.client.get_default_project()

            ds_loc = 'thread_index.csv'
            ds = proj.get_dataset(THREAD_INDEX_NAME)

            exists = ds.exists()
            if exists:
                ds.delete(drop_data=True)
                
            project_variables = dataiku.get_custom_variables()

            params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
            format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

            csv_dataset = proj.create_dataset(THREAD_INDEX_NAME, type='Filesystem', params=params,
                                                formatType='csv', formatParams=format_params)

            # Set dataset to managed
            ds_def = csv_dataset.get_definition()
            ds_def['managed'] = True
            csv_dataset.set_definition(ds_def)

            # Set schema
            csv_dataset.set_schema({'columns': [{'name': 'name', 'type':'string'}]})

            ds2 = dataiku.Dataset(THREAD_INDEX_NAME)
            df = pd.DataFrame(columns=['name','type'])

            ds2.write_with_schema(df)

            return ds, False

    def init_definition_dataset(self):
        proj = self.client.get_default_project()

        ds_loc = 'thread_definition.csv'
        ds = proj.get_dataset(THREAD_DS_NAME)

        exists = ds.exists()
        if exists:
            ds.delete(drop_data=True)
            
        project_variables = dataiku.get_custom_variables()

        params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
        format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

        csv_dataset = proj.create_dataset(THREAD_DS_NAME, type='Filesystem', params=params,
                                            formatType='csv', formatParams=format_params)

        # Set dataset to managed
        ds_def = csv_dataset.get_definition()
        ds_def['managed'] = True
        csv_dataset.set_definition(ds_def)

        # Set schema
        csv_dataset.set_schema({'columns': [{'name': 'name', 'definition':'string'}]})

        ds2 = dataiku.Dataset(THREAD_DS_NAME)
        df = pd.DataFrame(columns=['name','definition'])

        ds2.write_with_schema(df)

        return ds, False

    def load_project(self, key):
        p = self.client.get_project(key).get_summary()

        ds = dataiku.Dataset(THREAD_DATASETS_NAME)
        datasets = ds.get_dataframe().query(f'project=="{key}"')

        p['datasets'] = []
        for d in datasets:
            p['datasets'].append(d)

        return p
   
    def load_dataset(self, key):
        p_name, d_name = self.extract_name_project(key)
        ds = dataiku.Dataset(d_name, p_name)

        ds_ds = self.get_datasets_ds()
        rec = ds_ds.get_dataframe().query(f'key=="{key}"')

        lin_up = rec.iloc[0]['lineage_upstream']
        lin_down = rec.iloc[0]['lineage_downstream']

        res = {
            "schema":ds.read_schema(),
            "name": ds.full_name,
            "key": key,
            "id": p_name,
            "project": p_name,
            "meta": ds.read_metadata(),
            "lineage-upstream": lin_up,
            "lineage-downstream": lin_down
        }

        print(res)
        return res

    def get_stream(self, recipe, inputs_outputs, p_name):
        refs = []
        try:
            for j in recipe[inputs_outputs]:
                for i in range(len(recipe[inputs_outputs][j]['items'])):
                    name = recipe[inputs_outputs][j]['items'][i]['ref']
                    if '.' in name:
                        p_name, d_name = self.extract_name_project(name)
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
        if '.' in name:
            p_name, d_name = self.extract_name_project(name)
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
        splits = full_ds_name.split('.')
        p_name = splits[0]
        d_name = splits[1]

        if len(splits) > 2:
            c_name = splits[2]
            return p_name, d_name, c_name

        return p_name, d_name

    def get_full_dataset_name(self, name, project):
        return project + '.' + name

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

                    # ds['lineage_upstream'] = []

                    # for result in result_up:
                    #     r = result
                    #     while len(r['lineage_upstream_full']) > 0:
                    #         r = r[0]
                    
                    #     ds['lineage_upstream'].append(r[0]['name'])
                        
                if 'lineage_downstream' in ds:
                    result_down = self.traverse_lineage(ds['full_name'], all_projects, upstream=False)
                    ds['lineage_downstream_full'] = result_down

                    # ds['lineage_downstream'] = []

                    # for result in result_down:
                    #     r = result
                    #     while len(r['lineage_downstream_full']) > 0:
                    #         r = r[0]
                    
                    #     ds['lineage_downstream'].append(r[0]['name'])

        #         # print(result_up)

    def get_datasets_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_DATASETS_NAME)

        return proj_dataset

    def get_index_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_INDEX_NAME)

        return proj_dataset

    def scan_server(self, proj_ds):

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
            # # meta = project.get_metadata()
            # # settings = project.get_settings().get_raw()

            datasets = project.list_datasets()
            recipes = project.list_recipes()
            folders = project.list_managed_folders()

            scan_obj[proj]['datasets'] = datasets
            scan_obj[proj]['recipes'] = recipes
            scan_obj[proj]['folders'] = folders

            index_list.append({
                "name": project.get_summary()['name'],
                "type": "project",
                "key": proj
            })

            for dataset in datasets:
                index_list.append({
                    "name": dataset['name'],
                    "type": "dataset",
                    "key": self.get_full_dataset_name(dataset['name'], proj)
                })

                for column in dataset['schema']['columns']:
                   index_list.append({
                     "name": column['name'],
                     "type": "column",
                    "key": self.get_full_dataset_name(dataset['name'], proj) + '.' + column['name']
                     }) 

        # print('start get lineage...')
        self.get_ds_lineage(scan_obj)
        # print('end get lineage')

        # print(json.dumps(scan_obj))

        ds_list = []
        for p in scan_obj:
            datasets = scan_obj[p]['datasets']
            for ds in datasets:
                    obj = { 'project': p, 'name': ds.name, 'key': self.get_full_dataset_name(ds.name, p)}
                    if 'lineage_downstream' in ds:
                        obj['lineage_downstream'] = ds['lineage_downstream_full']
                    else:
                        obj['lineage_downstream'] =[]
                    if 'lineage_upstream' in ds:
                        obj['lineage_upstream'] = ds['lineage_upstream_full']
                    else:
                        obj['lineage_upstream'] =[]
                        
                    ds_list.append(obj)

        # dataset_dataset = dataiku.Dataset(ds_ds.name)
        # df = pd.DataFrame.from_dict(ds_list)
        # dataset_dataset.write_with_schema(df)

        df = pd.DataFrame.from_dict(ds_list)
        # df.reset_index(inplace=True)
        
        proj_dataset = dataiku.Dataset(THREAD_DS_NAME)
        proj_dataset.write_with_schema(df)

        df = pd.DataFrame.from_dict(index_list)
        # df.reset_index(inplace=True)
        
        idx_ds = dataiku.Dataset(THREAD_INDEX_NAME)
        idx_ds.write_with_schema(df)

        return True