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
    # return json.dumps(
    #     {
    #         "results": [{"type": "project",
    #         "name": args.get('term')}]
    #     }
    # )

@app.route('/load-item', methods=['POST'])
def load_item():
    # load full info (including lineage) for project, dataset, column or definition
    return json.dumps([]) 
    
# @app.route('/get-projects')
# def get_projects():

    # util = dss_utils()

    # proj_ds, exists = util.init_proj_dataset()
    # # ds_ds, exists = util.init_definition_dataset()

    # res = {}
    # if not exists:
    #     res_df = util.scan_server(proj_ds)
    # else:
    #     res_df = dataiku.Dataset(proj_ds.name).get_dataframe()
    
    # projs = res_df['index'].unique()

    # for p in projs:
    #     res[p] = {}
    #     res[p]['datasets'] = res_df.query(f'index=="{p}"').iloc[0]['datasets']#.to_dict(orient='records')

    # return json.dumps(res)

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
THREAD_PROJ_NAME = '--Thread-Projects--'
THREAD_INDEX_NAME = '--Thread-Index--'

class dss_utils:

    def __init__(self):
        self.client = dataiku.api_client()
        # self.init_description_dataset()

    def init_proj_dataset(self):
        proj = self.client.get_default_project()

        ds_loc = 'thread_projects.csv'
        ds = proj.get_dataset(THREAD_PROJ_NAME)

        exists = ds.exists()
        if exists:
            ds.delete(drop_data=True)
            
        project_variables = dataiku.get_custom_variables()

        params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
        format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

        csv_dataset = proj.create_dataset(THREAD_PROJ_NAME, type='Filesystem', params=params,
                                            formatType='csv', formatParams=format_params)

        # Set dataset to managed
        ds_def = csv_dataset.get_definition()
        ds_def['managed'] = True
        csv_dataset.set_definition(ds_def)

        # Set schema
        csv_dataset.set_schema({'columns': [{'name': 'name', 'type':'string'}]})

        ds2 = dataiku.Dataset(THREAD_PROJ_NAME)
        df = pd.DataFrame(columns=['project','name'])

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
                            next_levels.append({'name':l, dir_full: nxt})
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
                    # ds['lineage_upstream_full'] = result_up

                    ds['lineage_upstream'] = []

                    for result in result_up:
                        r = result
                        while len(r['lineage_upstream_full']) > 0:
                            r = r[0]
                    
                        ds['lineage_upstream'].append(r[0]['name'])
                        
                if 'lineage_downstream' in ds:
                    result_down = self.traverse_lineage(ds['full_name'], all_projects, upstream=False)
                    # ds['lineage_downstream_full'] = result_down

                    ds['lineage_downstream'] = []

                    for result in result_down:
                        r = result
                        while len(r['lineage_downstream_full']) > 0:
                            r = r[0]
                    
                        ds['lineage_downstream'].append(r[0]['name'])

        #         # print(result_up)

    def get_proj_ds(self):
        proj_dataset = dataiku.Dataset(THREAD_PROJ_NAME)

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

            project_list.append(proj)

            # print(proj)
            project = self.client.get_project(proj)
            # meta = project.get_metadata()
            # settings = project.get_settings().get_raw()

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
                    "key": self.get_full_dataset_name(dataset['name'], proj) + '.' + column.name
                     }) 

        print('start get lineage...')
        # self.get_ds_lineage(scan_obj)
        print('end get lineage')

        # print(json.dumps(scan_obj))

        # for p in scan_obj:
        #     datasets = scan_obj[p]['datasets']
        #     for ds in datasets:
        #             obj = { 'project': p, 'name': ds.name}
        #             if 'lineage_downstream' in ds:
        #                 obj['lineage_downstream'] = ds['lineage_downstream']
        #             else:
        #                 obj['lineage_downstream'] =[]
        #             if 'lineage_upstream' in ds:
        #                 obj['lineage_upstream'] = ds['lineage_upstream']
        #             else:
        #                 obj['lineage_upstream'] =[]
                        
        #             ds_list.append(obj)

        # dataset_dataset = dataiku.Dataset(ds_ds.name)
        # df = pd.DataFrame.from_dict(ds_list)
        # dataset_dataset.write_with_schema(df)

        df = pd.DataFrame.from_dict(scan_obj, orient='index')
        df.reset_index(inplace=True)
        
        proj_dataset = dataiku.Dataset(proj_ds.name)
        proj_dataset.write_with_schema(df)

        df = pd.DataFrame.from_dict(index_list)
        # df.reset_index(inplace=True)
        
        idx_ds = dataiku.Dataset(THREAD_INDEX_NAME)
        idx_ds.write_with_schema(df)

        return True