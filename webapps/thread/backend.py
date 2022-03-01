import dataiku
import pandas as pd
from flask import request
import numpy as np
import ast
import sentry_sdk

from util.dss import dss_utils

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

@app.route('/get-projects')
def get_projects():
    proj_ds, exists = dss_utils.init_proj_dataset()
    ds_ds, exists = dss_utils.init_description_dataset()

    res = {}
    if not exists:
        res_df = dss_utils.scan_server(proj_ds)
    else:
        res_df = dataiku.Dataset(proj_ds.name).get_dataframe()
    
    projs = res_df['index'].unique()

    for p in projs:
        res[p] = {}
        res[p]['datasets'] = res_df.query(f'index=="{p}"').iloc[0]['datasets']#.to_dict(orient='records')

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






