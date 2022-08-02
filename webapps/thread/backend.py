from ctypes import util
from dis import disassemble
from http import client
import json
import gc

# from tkinter import E
import dataiku
import pandas as pd
from flask import request
import numpy as np
import ast
import sentry_sdk
import random
from sentry_sdk import capture_exception
from sentry_sdk import capture_message
from sentry_sdk.integrations.flask import FlaskIntegration
import re
import logging
from datetime import datetime
import time

from python_lib.dss_utils import dss_utils

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

THREAD_DEFINITIONS_NAME = '--Thread-Definitions--'
THREAD_DATASETS_NAME = '--Thread-Datasets--'
THREAD_INDEX_NAME = '--Thread-Index--'
THREAD_REMAPPING_NAME = '--Thread-Column-Mapping--'

sentry_sdk.init(
   dsn="https://39709475b09348ceb3f0a98857d98e1e@o1303348.ingest.sentry.io/6542218",
    integrations=[
        FlaskIntegration(),
    ],

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0
)

def init() :
    client = dataiku.api_client()

    p = client.get_default_project()
    proj_vars = p.get_variables() 
    if 'rescan_cron' in proj_vars["standard"]:
        rescan_cron = proj_vars["standard"]['rescan_cron']
        
        scheduler = BackgroundScheduler()
        scheduler.add_job(scan, CronTrigger.from_crontab(rescan_cron))
        scheduler.start()

        print('scan will be firing on cron: ' + rescan_cron)

@app.route('/get-user')
def get_user():
    try:
        un = get_active_user_name()
        
        if len(un) > 0:
            data = {"status": "ok", "you_are": un}
        else:
            data = {"status": "denied", "you_are": 'not logged in'}
    except:
        data = {"status": "denied", "you_are": 'not logged in'}

    return json.dumps(data)

@app.route('/scan-project', methods=['GET'])
def scan_project():
    dss = dss_utils()

    args = request.args
    id = args.get('key')

    dss.scan_project(id)

    return json.dumps({"result": "scan complete"})

@app.route('/dss-stats', methods=['GET'])
def dss_stats():
    dss = dss_utils()

    return json.dumps({"stats": dss.get_collection_stats()})

@app.route('/scan', methods=['GET'])
def scan():
    try:
        client = dataiku.api_client()

        p = client.get_default_project() #dataiku.Project() # create a project handle
        proj_vars = p.get_variables() # retrieve your variables as a dictionary

        dss = dss_utils()

        # initializing the datasets
        ds1 = dss.init_thread_ds(THREAD_DATASETS_NAME, 'thread_datasets.csv')
        ds2 = dss.init_thread_ds(THREAD_INDEX_NAME, 'thread_indexes.csv')
        ds3 = dss.init_thread_ds(THREAD_REMAPPING_NAME, 'thread_remapping.csv')
        ds4 = dss.init_thread_ds(THREAD_DEFINITIONS_NAME, 'thread_definitions.csv', False)

        # create the internal zone
        zone_name = "Thread Internal Datasets"
        zone = init_thread_zone(p, zone_name)

        # add the datasets to our default zone
        zone.add_item(ds1)
        zone.add_item(ds2)
        zone.add_item(ds3)
        zone.add_item(ds4)

        # limit to folders
        # folders = []
        # if 'limit_to_folders' in proj_vars["standard"]:
        #     folders = proj_vars["standard"]['limit_to_folders']
        tags = []
        if 'limit_to_tags' in proj_vars["standard"]:
            tags = proj_vars["standard"]['limit_to_tags']

        result = dss.scan_server(tags)

        # reset the project variables
        proj_vars["standard"]['limit_to_tags'] = tags
        p.set_variables(proj_vars) 

        return json.dumps({"result": "scan complete"})
    except Exception as e:
        capture_exception(e)
        return json.dumps({"result": "error", "message": str(e)})

@app.route('/tag-list', methods=['GET'])
def tag_list():
    dss = dss_utils()

    return json.dumps(dss.get_tag_list())

@app.route('/def-by-tag', methods=['GET'])
def def_by_tag():
    args = request.args
    df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
    result3 = df[df['tags'].str.contains(args.get('term'), case=False)]
   
    result3['search_def'] = result3['name'] + ' | ' + result3['description']

    return result3.to_json(orient='records')

@app.route('/def-search', methods=['GET'])
def defintition_list():
    args = request.args
    
    try:
        df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
        result = df[df['name'].str.contains(args.get('term'), case=False)]
        result2 = df[df['description'].str.contains(args.get('term'), case=False)]
        result3 = df[df['tags'].str.contains(args.get('term'), case=False)]

        merged_df = pd.concat([result, result2, result3], ignore_index=True)
        merged_df.drop_duplicates(subset=['id'],inplace=True)

        merged_df['search_def'] = merged_df['name'] + ' | ' + merged_df['description'] + ' | ' + merged_df['tags']
        return merged_df.to_json(orient='records')
    except:
        return json.dumps([])

@app.route('/scan-new', methods=['GET'])
def scan_new():
    dss = dss_utils()
    new_projects = dss.check_new_projects()

    return json.dumps({'projects': new_projects})

@app.route('/search', methods=['GET'])
def search():
    try:
        args = request.args
        dss = dss_utils()

        idx_ds = dss.get_index_ds()
        df = idx_ds.get_dataframe()

        df = df.dropna(subset=['description'])

        result = df[df['description'].str.contains(args.get('term'), case=False)]
        
        return result.to_json(orient="records")
    except:
        return json.dumps({'success': False})

@app.route('/delete-definition', methods=['GET'])
def delete_definition():
    args = request.args
    id = int(args.get('id'))

    dss = dss_utils()
    dss.delete_definition(id)

    return json.dumps({'success':True})

@app.route('/export', methods=['GET'])
def export():
    dss = dss_utils()
    dss.catalog_export()

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
    try:
        args = request.args
        key = args.get('key')
        key = key.replace(' | ', '|')

        dss = dss_utils()
        un = get_active_user_name()

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
            ds['success'] = True

            return json.dumps(ds)
        else:
            if res['object_type'] == 'project':

                p = dss.load_project(key)
                p['object_type'] = 'project'
                col_ct, col_def = dss.calc_project_def_ct(key)
                p['total_cols'] = col_ct
                p['total_cols_def'] = col_def
                p['success'] = True
                p['user_security'] = dss.user_project_access(key, un)

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
                    col['user_security'] = dss.user_project_access(p_name, un) # can_user_access_project(p_name)
                    col['success'] = True

                    if len(def_df) > 0:
                        col['definition'] = def_df.to_dict('records')[0]
                        
                    return col
                if res['object_type'] == 'definition':
                    # logging.info(f'searching for definition key: {key}')
                    df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()
                    res = df.loc[df['id'] == int(key)].to_dict('records')[0]    
                    res['object_type'] = 'definition'
                    res['tag_list'] = dss.get_tag_list()

        res['success'] = True
        response_json = json.dumps(res) 
        return response_json

    except Exception as e:
        capture_exception(e)
        return json.dumps({'success': False})

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

    desc_txt = '--'
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
                "key": new_id,
                "last_modified": int(time.time())
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
        try:
            client_as_user = get_user_client()
            dss.update_column_description(data['applied_to'], data['description'], client_as_user)
        except:
            return json.dumps({"success": False,
              "message": "There was an issue updating the column description (do you have access?)"
            })        
     
    return json.dumps({"success": True,
        "value": desc
    })


def init_thread_zone(project, zone_name):
     # initializing flow zones
    flow = project.get_flow()
    zone = None
    for zn in flow.list_zones():
        if zn.name == zone_name:
            zone = zn
            break

    if zone is None:
        zone = flow.create_zone(zone_name)

    return zone

def get_user_client():
    headers = dict(request.headers)
    auth_info = dataiku.api_client().get_auth_info_from_browser_headers(headers)
    user = dataiku.api_client().get_user(auth_info['authIdentifier'])
    return user.get_client_as()

def get_active_user_name():
    try:
        headers = dict(request.headers)
        # Get the auth info of the user performing the request
        auth_info = dataiku.api_client().get_auth_info_from_browser_headers(headers)
        
        if 'authIdentifier' in auth_info:
           return auth_info["authIdentifier"]
    except:
        return ''


init()