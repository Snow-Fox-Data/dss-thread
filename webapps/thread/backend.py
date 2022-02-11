import dataiku
import pandas as pd
from flask import request
import numpy as np
import ast
import sentry_sdk
from sentry_sdk import capture_exception
from sentry_sdk import capture_message

sentry_sdk.init(
    "https://1eedab484f7149b1b63cfc1d67cdf69e@o1133579.ingest.sentry.io/6180261",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0
)

intitialized = False
# THREAD_DS_NAME = '--Thread-Datasets--'
THREAD_PROJ_NAME = '--Thread-Projects--'

# def init_dataset_dataset():
    # client = dataiku.api_client()
    # proj = client.get_default_project()

    # ds_loc = 'thread_datasets.csv'
    # ds = proj.get_dataset(THREAD_DS_NAME)

    # exists = ds.exists()
    # if not exists:
    #     project_variables = dataiku.get_custom_variables()

    #     params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
    #     format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

    #     csv_dataset = proj.create_dataset(THREAD_DS_NAME, type='Filesystem', params=params,
    #                                         formatType='csv', formatParams=format_params)

    #     # Set dataset to managed
    #     ds_def = csv_dataset.get_definition()
    #     ds_def['managed'] = True
    #     csv_dataset.set_definition(ds_def)

    #     # Set schema
    #     csv_dataset.set_schema({'columns': [{'name': 'name', 'type':'string'}]})

    #     ds2 = dataiku.Dataset(THREAD_DS_NAME)
    #     df = pd.DataFrame(columns=['project','name'])
        
    #     ds2.write_with_schema(df)

    #     print(f'created {THREAD_DS_NAME} dataset')
    # else:
    #     print(f'{THREAD_DS_NAME} already exists')

    # return ds, exists

@app.route('/getuser')
def getuser():
    usr = get_user()

    return json.dumps({"user": usr})

@app.route('/get-projects')
def get_projects():
    proj_ds, exists = init_proj_dataset()
    # ds_ds, exists = init_proj_dataset()

    res = {}
    if not exists:
        res = scan_server(proj_ds)
    else:
        proj_df = dataiku.Dataset(proj_ds.name).get_dataframe()
        projs = proj_df['index'].unique()

        for p in projs:
            res[p] = {}
            res[p]['datasets'] = proj_df.query(f'index=="{p}"').to_dict(orient='records')

    return json.dumps(res)

@app.route('/dataset-details', methods=['POST'])
def dataset_details():
    data = json.loads(request.data)
    dataset_name = data['dataset-name']
    project = data['project']

    print(project, dataset_name)
    client = dataiku.api_client()
    ds_proj = client.get_project(project)
    ds_list = ds_proj.list_datasets()
    dku_ds = [x for x in ds_list if x['name']==dataset_name][0]
    
    ds = dataiku.Dataset(THREAD_DS_NAME)
    res = ds.get_dataframe().query(f'name=="{dataset_name}"').to_dict('records')[0]

    dku_ds['lineage_downstream'] = res['lineage_downstream']
    dku_ds['lineage_upstream'] = res['lineage_upstream']

    return json.dumps({
        'success': True,
        'dataset': dku_ds, #
        'dataset_name': get_full_dataset_name(dataset_name, project)
    })

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

def update_column_description(column_array, description):
    if type(column_array)==str:
        column_array = [column_array]
        
    client = dataiku.api_client()
    for i in column_array:
        lst = i.split('.')
        project, dataset, column = lst[0], lst[1], lst[2]
        p = client.get_project(project)
        ds = p.get_dataset(dataset)
        ds_schema = ds.get_schema()
        for z in ds_schema['columns']: 
            if z['name']==column:
                z['comment']=description

        ds.set_schema(ds_schema)

def scan_server(proj_ds):

    client = dataiku.api_client()
    # root_folder = client.get_root_project_folder()
    # dss_folders = root_folder.list_child_folders()
    
    project_list = []
    ds_list = []
    scan_obj = {}

    dss_projects = client.list_project_keys()
    for proj in dss_projects:
        if 'VMCHURNPREDICTION' in proj.upper():
            scan_obj[proj] = {}

            project_list.append(proj)

            # print(proj)
            project = client.get_project(proj)
            # meta = project.get_metadata()
            # settings = project.get_settings().get_raw()

            datasets = project.list_datasets()
            recipes = project.list_recipes()
            folders = project.list_managed_folders()

            scan_obj[proj]['datasets'] = datasets
            scan_obj[proj]['recipes'] = recipes
            scan_obj[proj]['folders'] = folders

    print('start get lineage...')
    get_ds_lineage2(scan_obj)
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
    proj_dataset = dataiku.Dataset(proj_ds.name)
    proj_dataset.write_with_schema(df.reset_index(inplace=True))

    return df

def init_proj_dataset():
    client = dataiku.api_client()
    proj = client.get_default_project()

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

    return ds, exists

def get_full_dataset_name(name, project):
    return project + '.' + name

def get_stream(recipe, inputs_outputs, p_name):
    refs = []
    try:
        for j in recipe[inputs_outputs]:
            for i in range(len(recipe[inputs_outputs][j]['items'])):
                name = recipe[inputs_outputs][j]['items'][i]['ref']
                if '.' in name:
                    p_name, d_name = extract_name_project(name)
                else:
                    d_name = name

                try:
                    exist = dataiku.Dataset(d_name, p_name).get_location_info()
                    refs.append(get_full_dataset_name(d_name, p_name))
                except: 
                    print(f'{p_name}.{d_name} doesnt exist')
                    # doesn't exist, this is probably a folder or other item we don't currently support

    except Exception as e:
        capture_exception(e)
        
    if refs is None:
        return []

    return refs

def get_ds_by_name(name, all_projects, p_name=None):
    # print(name)
    if '.' in name:
        p_name, d_name = extract_name_project(name)
    else:
        d_name = name

    for i in range(len(all_projects[p_name]['datasets'])):
        ds = all_projects[p_name]['datasets'][i]
        if ds['name'] == d_name:
            return ds

    return None

def get_ds_lineage2(all_projects):
    for p in all_projects:
        project = all_projects[p]

        for r in range(len(project['recipes'])):
            recipe = project['recipes'][r]
            ins = get_stream(recipe, 'inputs', p)            
            outs = get_stream(recipe, 'outputs', p)  

            for i in ins:
                # get the input dataset for this recipe
                ds = get_ds_by_name(i, all_projects, p)
                if ds is not None:
                    if not 'lineage_downstream' in ds:
                        ds['lineage_downstream'] = outs
                    else:
                        for o in outs:
                            if not o in ds['lineage_downstream']:
                                ds['lineage_downstream'].append(o)
                
            for o in outs:
                ds = get_ds_by_name(o, all_projects, p)
                if ds is not None:
                    if not 'lineage_upstream' in ds:
                        ds['lineage_upstream'] = ins
                    else:
                        for i in ins:
                            if not i in ds['lineage_upstream']:
                                ds['lineage_upstream'].append(i)


def get_ds_lineage(all_projects):

    # get the 1st level of upstream / downstream
    for p in all_projects:
        project = all_projects[p]

        for r in range(len(project['recipes'])):
            try:
                recipe = project['recipes'][r]
                ins = get_stream(recipe, 'inputs', p)            
                outs = get_stream(recipe, 'outputs', p)            

                for i in ins:
                    # if i == 'VMCHURNPREDICTION.auc_results':
                        # print(recipe)
                    try:
                        ds = get_ds_by_name(i, all_projects, p)
                        if recipe['name'] == 'split_churn_prepared':
                            print(ds)
                            print('-------')
                        if ds is not None:
                            if not 'lineage_downstream' in ds:
                                ds['lineage_downstream'] = outs
                            else:
                                for o in outs:
                                    if not o in ds['lineage_downstream']:
                                        ds['lineage_downstream'].append(o)
                    except Exception as e: 
                        capture_exception(e)

                for o in outs:
                    # if o == 'VMCHURNPREDICTIONauc_results':
                        # print(recipe)
                    try:
                        ds = get_ds_by_name(o, all_projects, p)
                        if ds is not None:
                            if not 'lineage_upstream' in ds:
                                ds['lineage_upstream'] = ins
                            else:
                                for i in ins:
                                    if not i in ds['lineage_upstream']:
                                        ds['lineage_upstream'].append(i)

                    except Exception as e: 
                        capture_exception(e)

            except Exception as e: 
                capture_exception(e)

    # get the full dataset lineage
    # for p in all_projects:
    #     project = all_projects[p]
    #     for d in range(len(project['datasets'])):
    #         ds = project['datasets'][d]
    #         ds['full_name'] = get_full_dataset_name(ds['name'], p)

    #         if 'lineage_upstream' in ds:
    #             result_up = traverse_lineage(ds['full_name'], all_projects, upstream=True)

    #         if 'lineage_downstream' in ds:
    #             result_down = traverse_lineage(ds['full_name'], all_projects, upstream=False)

    #         print(result_up)
               
def traverse_lineage(ds_name, all_projects, upstream=True, recur_ct = 0):
    try:
        ds = get_ds_by_name(ds_name, all_projects)

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

                        nxt = traverse_lineage(l, all_projects, upstream, recur_ct)
                        next_levels.append({'name':l, dir_full: nxt})
                    except Exception as e:
                        capture_exception(e)
            
        return next_levels
            

    except Exception as e: 
        print(f'error traversing {ds_name}')
        return []

# def traverse_lineage(ds_name, all_projects, upstream=True, recur_ct = 0):
#     try:
#         ds = get_ds_by_name(ds_name, all_projects)

#         next_levels = []
#         if not ds is None:
#             dir = 'lineage_upstream'
#             if upstream == False:
#                 dir = 'lineage_downstream'

#             dir_full = dir + '_full'

#             if (dir + '_complete') in ds:
#                 return ds[dir_full]

#             if dir in ds:
#                 for l in ds[dir]:
#                     try:
#                         recur_ct = recur_ct + 1
#                         if recur_ct > 300:
#                             print(f'recursive error {dir} - {ds_name}, {l}, {ds[dir]}')
#                             return []

#                         nxt = traverse_lineage(l, all_projects, upstream, recur_ct)
#                         next_levels.append({'name':l, dir_full: nxt})
#                     except Exception as e:
#                         capture_exception(e)
            
#         return next_levels
            

#     except Exception as e: 
#         print(f'error traversing {ds_name}')
#         return []

# def get_col_lineage(ds, col_name, all_projects):
#     up_matches = []
#     down_matches = []

    

#     try:
#         if 'lineage_upstream_full' in ds:
#             for up in ds['lineage_upstream_full']:
#                 up_ds = get_ds_by_name(up['name'], all_projects)
#                 full_col_name = get_full_col_name(up_ds, col_name)
        
#                 for col in up_ds['schema']['columns']:
#                     # print(col, col_name)
#                     if col['name'].upper() == col_name.upper():
#                         up_matches.append(full_col_name);


#         if 'lineage_downstream_full' in ds:
#             for down in ds['lineage_downstream_full']:
#                 down_ds = get_ds_by_name(down['name'], all_projects)
#                 full_col_name = get_full_col_name(down_ds, col_name)
                
#                 for col in down_ds['schema']['columns']:
#                     if col['name'].upper() == col_name.upper():
#                         down_matches.append(full_col_name)
#     except:
#         print('col lineage error')

#     return up_matches, down_matches

# def get_dataset_lineage(full_ds_name):
#     p_name, ds_name = extract_name_project(full_ds_name)


# def get_all_lineage(all_projects):

#     # get the 1st level of upstream / downstream
#     for p in all_projects:
#         project = all_projects[p]

#         for r in range(len(project['recipes'])):
#             try:
#                 recipe = project['recipes'][r]
#                 ins = get_stream(recipe, 'inputs', p)            
#                 outs = get_stream(recipe, 'outputs', p)            



#                 for i in ins:
#                     try:
#                         ds = get_ds_by_name(i, all_projects, p)
#                         if not 'lineage_downstream' in ds:
#                             ds['lineage_downstream'] = outs
#                         else:
#                             for o in outs:
#                                 if not o in ds['lineage_downstream']:
#                                     ds['lineage_downstream'].append(o)
#                     except:
#                         print(f'input lineage error: ' + i)

#                 for o in outs:
#                     try:
#                         ds = get_ds_by_name(o, all_projects, p)
#                         if not 'lineage_upstream' in ds:
#                             ds['lineage_upstream'] = ins
#                         else:
#                             for i in ins:
#                                 if not i in ds['lineage_upstream']:
#                                     ds['lineage_upstream'].append(i)
#                     except:
#                         print(f'output lineage error: ' + o)
#             except:
#                 print('lineage error')

#     # get the full dataset lineage
#     for p in all_projects:
#         project = all_projects[p]
#         for d in range(len(project['datasets'])):
#             ds = project['datasets'][d]
#             ds['full_name'] = get_full_dataset_name(ds['name'], p)

#             if 'lineage_upstream' in ds:
#                 traverse_lineage(ds['full_name'], all_projects, upstream=True)

#             if 'lineage_downstream' in ds:
#                 traverse_lineage(ds['full_name'], all_projects, upstream=False)
               
#             for i in range(len(ds['schema']['columns'])):
#                 col = ds['schema']['columns'][i]
#                 up, down = get_col_lineage(ds, col['name'], all_projects)
#                 col['lineage_upstream'] = up
#                 col['lineage_downstream'] = down
                
   
# def get_ds_lineage(all_projects):

#     # get the 1st level of upstream / downstream
#     for p in all_projects:
#         project = all_projects[p]

#         for r in range(len(project['recipes'])):
#             try:
#                 recipe = project['recipes'][r]
#                 ins = get_stream(recipe, 'inputs', p)            
#                 outs = get_stream(recipe, 'outputs', p)            

#                 for i in ins:
#                     try:
#                         ds = get_ds_by_name(i, all_projects, p)
#                         if not 'lineage_downstream' in ds:
#                             ds['lineage_downstream'] = outs
#                         else:
#                             for o in outs:
#                                 if not o in ds['lineage_downstream']:
#                                     ds['lineage_downstream'].append(o)
#                     except:
#                         print(f'input lineage error: ' + i)

#                 for o in outs:
#                     try:
#                         ds = get_ds_by_name(o, all_projects, p)
#                         if not 'lineage_upstream' in ds:
#                             ds['lineage_upstream'] = ins
#                         else:
#                             for i in ins:
#                                 if not i in ds['lineage_upstream']:
#                                     ds['lineage_upstream'].append(i)
#                     except:
#                         print(f'output lineage error: ' + o)
#             except:
#                 print('lineage error')

#     # get the full dataset lineage
#     for p in all_projects:
#         project = all_projects[p]
#         for d in range(len(project['datasets'])):
#             ds = project['datasets'][d]
#             ds['full_name'] = get_full_dataset_name(ds['name'], p)

#             if 'lineage_upstream' in ds:
#                 traverse_lineage(ds['full_name'], all_projects, upstream=True)

#             if 'lineage_downstream' in ds:
#                 traverse_lineage(ds['full_name'], all_projects, upstream=False)
               
#             for i in range(len(ds['schema']['columns'])):
#                 col = ds['schema']['columns'][i]
#                 up, down = get_col_lineage(ds, col['name'], all_projects)
#                 col['lineage_upstream'] = up
#                 col['lineage_downstream'] = down

# def init_proj_dataset():
#     client = dataiku.api_client()
#     proj = client.get_default_project()

#     ds_name = '--Thread-Projects--'
#     ds_loc = 'thread_projects.csv'
#     ds = proj.get_dataset(ds_name)
#     if not ds.exists():
#         project_variables = dataiku.get_custom_variables()

#         params = {'connection': 'filesystem_folders', 'path': project_variables['projectKey']  + '/' + ds_loc}
#         format_params = {'separator': '\t', 'style': 'unix', 'compress': ''}

#         csv_dataset = proj.create_dataset(ds_name, type='Filesystem', params=params,
#                                             formatType='csv', formatParams=format_params)

#         # Set dataset to managed
#         ds_def = csv_dataset.get_definition()
#         ds_def['managed'] = True
#         csv_dataset.set_definition(ds_def)

#         # Set schema
#         csv_dataset.set_schema({'columns': [{'name': 'name', 'type':'string'}]})

#         ds2 = dataiku.Dataset(ds_name)
#         df = pd.DataFrame(columns=['name'])
        
#         ds2.write_with_schema(df)

#         print(f'created {ds_name} dataset')
#     else:
#         print(f'{ds_name} already exists')

#     return ds

# @app.route('/initialize')
# def initialize():
#     # global global_ref
    
#     get_user()

#     init_proj_dataset()

#     return json.dumps({'result': 'success'})