import dataiku 

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
                return proj.get_dataset(name)
            
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

        return proj.get_dataset(name)

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

    def catalog_export(self):
        # dss = dss_utils()
        df = dataiku.Dataset(THREAD_DEFINITIONS_NAME).get_dataframe()

        applied_set = []
        tag_set = []
        for idx, row in df.iterrows():
            applieds = json.loads(row['applied_to'])

            for applied in applieds:
                app_spl = applied.split('|')
                applied_set.append({'definition_id': row['id'], 'applied_to': applied, 'project': app_spl[0],
                'dataset': app_spl[1], 'column': app_spl[2]})
            
            tags = json.loads(row['tags'])
            for tag in tags:
                tag_set.append({'tag': tag, 'definition_id': row['id']})
                
        def_ds = self.init_thread_ds('definitions', 'definitions.csv', True)
        applied_ds = self.init_thread_ds('applied_to', 'applied_to.csv', True)
        tag_ds = self.init_thread_ds('tags', 'tags.csv', True)

        zone_name = "Thread Exports"
        proj = self.client.get_default_project()
        zone = init_thread_zone(proj, zone_name)

        # add the datasets to our default zone
        zone.add_item(def_ds)
        zone.add_item(applied_ds)
        zone.add_item(tag_ds)

        dataiku.Dataset(def_ds.name).write_dataframe(df[['id','name', 'description']],  infer_schema=True, dropAndCreate=True)
        dataiku.Dataset(applied_ds.name).write_dataframe(pd.DataFrame.from_dict(applied_set),  infer_schema=True, dropAndCreate=True)
        dataiku.Dataset(tag_ds.name).write_dataframe(pd.DataFrame.from_dict(tag_set), infer_schema=True, dropAndCreate=True)

    def check_new_projects(self):
        index_df = dataiku.Dataset(THREAD_INDEX_NAME).get_dataframe()
        dss_projects = self.client.list_project_keys()

        new_projects = []
        for p in dss_projects:
            if len(index_df.query(f'key=="{p}"')) == 0:
                logging.info(f'new project: {p}')

                # new project
                if self.scan_project(p):
                    new_projects.append(p)

        return new_projects
            
    def get_collection_stats(self):
        try:
            index_df = dataiku.Dataset(THREAD_INDEX_NAME).get_dataframe()
            col_ct = len(index_df.query('object_type=="column"'))
            dataset_ct = len(index_df.query('object_type=="dataset"'))
            project_ct = len(index_df.query('object_type=="project"'))
            def_ct = len(index_df.query('object_type=="definition"'))

            recents = index_df.query('object_type=="project"').nlargest(n=10, columns=['last_modified']).to_json(orient='records')

            return { "recents": recents, "column_ct": col_ct, "dataset_ct": dataset_ct, "project_ct": project_ct, "definition_ct": def_ct}
        except:
            return { "recents": [], "column_ct": 0, "dataset_ct": 0, "project_ct": 0, "definition_ct": 0}

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
        remapping_df = dataiku.Dataset(THREAD_REMAPPING_NAME).get_dataframe()
        try:
            schema = ds.read_schema()
            for col in schema:
                col['key'] = key + '|' + col['name']
                if col_lineage != 'none':
                    if col_lineage == 'all' or col['name'] == col_lineage:
                        col['lineage_upstream'] = self.get_col_lineage(remapping_df, key, col['name'], lin_up, True)
                        col['lineage_downstream'] = self.get_col_lineage(remapping_df, key, col['name'], lin_down, False)         
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

    def update_column_description(self, column_array, description, dss_client):
        if type(column_array)==str:
            column_array = [column_array]
            
        for i in column_array:
            if i is not None and len(i) > 0:
                logging.info(f'setting description for {i}')
                lst = i.split('|')
                project, dataset, column = lst[0], lst[1], lst[2]
                p = dss_client.get_project(project)
                ds = p.get_dataset(dataset)
                ds_schema = ds.get_schema()
                for z in ds_schema['columns']: 
                    if z['name']==column:
                        z['comment']=description

                ds.set_schema(ds_schema)

    def get_col_lineage(self, remapping_df, ds_name, col, ds_lineage_obj, upstream=False):
        dir = 'lineage_downstream'
        if upstream:
            dir = 'lineage_upstream'

        nxt = []

        for obj in ds_lineage_obj:
            ds = self.load_dataset(obj['name'], False)
            for column in ds['schema']:
                if not upstream:
                    to_col = obj['name'] + '|' + str(column['name'])
                    from_col = ds_name + '|' + str(col)
                else:
                    from_col = obj['name'] + '|' + str(column['name'])
                    to_col = ds_name + '|' + str(col)

                remap_found = len(remapping_df[(remapping_df['to'] == to_col)&(remapping_df['from'] == from_col)])>0

                if remap_found:
                    logging.info(f'remap found! {from_col}, {to_col}')

                if column['name'].lower() == col.lower() or remap_found:
                    lin = self.get_col_lineage(remapping_df, obj['name'], column['name'], ds[dir], upstream)

                    nxt.append({'name':obj['name'] + '|' + column['name'], dir:lin})#
        
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
                        err = 'doesnt exist' 
                        # logging.info(f'{p_name}.{d_name} doesnt exist')
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

    def user_project_access(self, proj_name, user_name):
        dss_users = self.client.list_users()
        for user in dss_users:
            if user['login'].lower() == user_name.lower():
                # first check to see if user is an admin
                grps = self.client.list_groups()
                for user_grp in user['groups']:
                    for dss_grp in grps:
                        if user_grp.lower() == dss_grp['name'].lower() and dss_grp['admin']:
                            return True
                
                # if not, check if they have access to a group that has write access to the project
                proj = self.client.get_project(proj_name)
                perms = proj.get_permissions() 
                for perm in perms['permissions']:
                    if 'group' in perm:
                        if perm['group'] in user['groups'] and perm['writeProjectContent']:
                            print(f'{user_name} has access through {perm["group"]} group')
                            return True
                    else:
                        if 'user' in perm:
                            if perm['user'].lower() == user_name.lower() and perm['writeProjectContent']:
                                print(f'{user_name} has direct access granted to project')
                                return True
                return False
        return False

    def get_ds_by_name(self, name, all_projects, p_name=None):
        # logging.info(name)
        if '|' in name:
            p_name, d_name, c_name = self.extract_name_project(name)
        else:
            d_name = name

        if p_name in all_projects:
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

        remapping_ds = dataiku.Dataset(THREAD_REMAPPING_NAME)
        remappings = [{'project':'--', 'from':'--', 'to': '--'}]

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
                                in_set = settings.get_recipe_inputs()['main']['items'][0]['ref']
                                out_set = settings.get_recipe_outputs()['main']['items'][0]['ref']

                                remappings.append({'project': p, 'from': p + '|' + in_set + '|' + renaming['from'], 'to': p + '|' + out_set + '|' +renaming['to']})
                                # print(f'from: {renaming["from"]} to: {renaming["to"]}')
                
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

        # write out the remappings...
        mapping_df = pd.DataFrame.from_dict(remappings)
        if len(all_projects) == 1: # we're doing a single project scan
            remap_df = remapping_ds.get_dataframe()
            remap_df = remap_df[remap_df.project!=p]
            mapping_df = mapping_df.append(remap_df, ignore_index=True)

        remapping_ds.write_dataframe(mapping_df, infer_schema=True, dropAndCreate=True)

        # add all shares
        for p in all_projects:
            project = all_projects[p]
            for d in range(len(project['datasets'])):
                ds = project['datasets'][d]

                for l in ds['lineage_upstream']:
                    if not p in l:
                        # this is a reference to a share
                        try:
                            shared_dataset = self.get_ds_by_name(l, all_projects)
                            shared_dataset['lineage_downstream'].append(ds['full_name'])
                        except:
                            logging.info(f'unable to find shared dataset {ds["full_name"]}')
                        # logging.info(f'added shared dataset: {l} => {ds["full_name"]}')

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

        if ds == None:
            return [] # we're doing a project scan and this is a shared dataset (we don't have in memory)
            
        else:
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
            except Exception as e:
                logging.info(f'error traversing {ds_name}')
                logging.info(e)
        
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

    def scan_server(self, limit_to_tags = []):
        project_list = []
        index_list = []
        scan_obj = {}

        dss_projects = self.client.list_project_keys()
        for proj in dss_projects:
            try:
                project = self.client.get_project(proj)

                # folder = project.get_project_folder().name
                # if len(limit_to_folders) > 0 and folder not in limit_to_folders:
                    # continue

                proj_meta = project.get_metadata()
                
                # check to make sure this project has the tags we want to scan (or no tags specified)
                ok_to_scan = False
                if len(limit_to_tags) == 0:
                    ok_to_scan = True
                else:
                    for limit in limit_to_tags:
                        for tag in proj_meta['tags']:
                            if limit.lower() == tag.lower():
                                ok_to_scan = True
                                break
                if not ok_to_scan:
                    continue

                datasets = project.list_datasets()
                recipes = project.list_recipes()
                folders = project.list_managed_folders()
                summary = project.get_summary()

                scan_obj[proj] = {}
                scan_obj[proj]['datasets'] = datasets
                scan_obj[proj]['recipes'] = recipes
                scan_obj[proj]['folders'] = folders

                last_mod = 0
                if 'versionTag' in summary:
                    last_mod = summary['versionTag']['lastModifiedOn']
                else:
                    if 'creationTag' in summary:
                        last_mod = summary['creationTag']['lastModifiedOn']

                index_list.append({
                    "name": proj.replace('|', ' | '), 
                    "object_type": "project",
                    "key": proj,
                    "last_modified": last_mod,
                    "description": proj_meta['label'] + '(' + proj.replace('|', ' | ') + ')'
                })

                for dataset in datasets:

                    # we don't want to index thread projects
                    if '--Thread' in dataset['name']:
                        del scan_obj[proj]
                        index_list.pop()
                        break

                    last_mod = 0
                    if 'versionTag' in dataset:
                        last_mod = dataset['versionTag']['lastModifiedOn']
                    else:
                        if 'creationTag' in summary:
                            last_mod = dataset['creationTag']['lastModifiedOn']

                    index_list.append({
                        "name": dataset['name'],
                        "object_type": "dataset",
                        "last_modified": last_mod,
                        "key": self.get_full_dataset_name(dataset['name'], proj),
                        "description": dataset['name']
                    })

                    for column in dataset['schema']['columns']:
                        index_list.append({
                            "name": column['name'],
                            "description": column['name'],
                            "last_modified": last_mod,
                            "object_type": "column",
                            "key": self.get_full_dataset_name(dataset['name'], proj) + '|' + column['name']
                            }) 
            except Exception as e:
                if proj in scan_obj:
                    del scan_obj[proj]
                
                logging.exception(e)

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
                    "last_modified": int(time.time()),
                        "name": row['name'],
                        "object_type": "definition",
                        "key": row['id'],
                        "description": row['name'] + ' | ' + row['description']
                    })
        except:
            logging.info('error indexing definitions')

        # datasets dataset
        df = pd.DataFrame.from_dict(ds_list)
        if len(ds_list) > 0:
            df = df.astype({"lineage_upstream": str})
            df = df.astype({"lineage_downstream": str})
            
        proj_dataset = dataiku.Dataset(THREAD_DATASETS_NAME)
        proj_dataset.write_dataframe(df, infer_schema=True, dropAndCreate=True)

        # index dataset
        df2 = pd.DataFrame.from_dict(index_list)
        
        idx_ds = dataiku.Dataset(THREAD_INDEX_NAME)
        idx_ds.write_dataframe(df2, infer_schema=True, dropAndCreate=True)

        del scan_obj
        gc.collect()

        return True
    
    def scan_project(self, proj):

        index_list = []
        scan_obj = {}

        scan_obj[proj] = {}
        project = self.client.get_project(proj)
        proj_meta = project.get_metadata()
        summary = project.get_summary()
        
        datasets = project.list_datasets()
        recipes = project.list_recipes()
        folders = project.list_managed_folders()

        scan_obj[proj]['datasets'] = datasets
        scan_obj[proj]['recipes'] = recipes
        scan_obj[proj]['folders'] = folders

        index_list.append({
            "name": proj.replace('|', ' | '), 
            "object_type": "project",
            "last_modified": summary['versionTag']['lastModifiedOn'],
            "key": proj,
            "description": proj_meta['label'] + '(' + proj.replace('|', ' | ') + ')'
        })

        for dataset in datasets:

             # we don't want to index thread projects
            if '--Thread-' in dataset['name']:
                del scan_obj[proj]
                index_list.pop()

                return False

            index_list.append({
                "name": dataset['name'],
                "object_type": "dataset",
                "key": self.get_full_dataset_name(dataset['name'], proj),
                "description": dataset['name'],
                "last_modified": dataset['versionTag']['lastModifiedOn']
            })

            for column in dataset['schema']['columns']:
                index_list.append({
                    "name": column['name'],
                    "description": column['name'],
                    "object_type": "column",
                "key": self.get_full_dataset_name(dataset['name'], proj) + '|' + column['name'],
                "last_modified": dataset['versionTag']['lastModifiedOn'],
                    }) 

        # compute the dataset lineage
        self.get_ds_lineage(scan_obj)
        
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

        # save datasets
        df = pd.DataFrame.from_dict(ds_list)
        if len(ds_list) > 0:
            df = df.astype({"lineage_upstream": str})
            df = df.astype({"lineage_downstream": str})
        
        proj_dataset = dataiku.Dataset(THREAD_DATASETS_NAME)
        exist = proj_dataset.get_dataframe()

        # drop all the old records for this project
        exist = exist[exist.project != proj]
        df = df.append(exist, ignore_index=True)

        proj_dataset.write_dataframe(df, infer_schema=True, dropAndCreate=True)

        # save index dataset
        df2 = pd.DataFrame.from_dict(index_list)
        idx_ds = dataiku.Dataset(THREAD_INDEX_NAME)
        exist = idx_ds.get_dataframe()
        exist = exist[exist.key != proj]
        df2 = df2.append(exist, ignore_index=True)

        idx_ds.write_dataframe(df2, infer_schema=True, dropAndCreate=True)

        return True

