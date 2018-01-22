var model = function (props) {
  return `import { create, query, update, remove } from '../services/generalApi';
  import { message } from 'antd';
  export default {
    namespace: '${props.name}',
  
    state: {
      data: {
        list: [],
        pagination: {},
      },
      loading: true,
    },
  
    effects: {
      *fetch({ payload }, { call, put }) {
        yield put({
          type: 'changeLoading',
          payload: true,
        });
        logs('payload', payload);
        const response = yield call(query, payload, '/api/sys_${props.name}');
        const { status = -1, body, errorMes = '' } = response;
        yield put({
          type: 'save',
          payload: body,
        });
        yield put({
          type: 'changeLoading',
          payload: false,
        });
      },
      *update({ payload }, { call, put }) {
        yield put({
          type: 'changeLoading',
          payload: true,
        });
        const response = yield call(update, payload, '/api/sys_${props.name}');
        const { status = -1, body, errorMes = '' } = response;
        if (status >= 200 && status < 300) {
          yield put({
            type: 'updateSuccess',
            payload,
          });
        } else {
          throw errorMes
        }
        yield put({
          type: 'changeLoading',
          payload: false,
        });
      },
      *add({ payload, callback }, { call, put }) {
        yield put({
          type: 'changeLoading',
          payload: true,
        });
        const response = yield call(create, payload, '/api/sys_${props.name}');
        const { status = -1, body, errorMes = '' } = response;
        if (status >= 200 && status < 300) {
          yield put({
            type: 'save',
            payload: body,
          });
        } else {
          throw errorMes
        }
  
        yield put({
          type: 'changeLoading',
          payload: false,
        });
  
        if (callback) callback();
      },
      *remove({ payload }, { call, put }) {
        yield put({
          type: 'changeLoading',
          payload: true,
        });
        const response = yield call(remove, payload, '/api/sys_${props.name}');
        const { status = -1, body, errorMes = '' } = response;
        if (status >= 200 && status < 300) {
          message.success('删除成功')
          yield put({
            type: 'deleteSuccess',
            payload,
          });
  
        } else {
          throw errorMes;
        }
        yield put({
          type: 'changeLoading',
          payload: false,
        });
      },
    },
  
    reducers: {
      save(state, action) {
        return {
          ...state,
          data: action.payload,
        };
      },
      changeLoading(state, action) {
        return {
          ...state,
          loading: action.payload,
        };
      },
      updateSuccess(state, action) {
        const updateData = action.payload;
        let newList = [];
        newList = state.data.list.map(data => {
          if (data.id === updateData.id) {
            return {
              ...data,
              ...updateData
            };
          }
          return data;
        });
        return {
          ...state,
          data: {
            ...state.data,
            list: newList
          }
  
  
        };
      },
      deleteSuccess(state, action) {
        const id = action.payload.id;
        const newList = state.data.list.filter(data => data.id != id);
        return {
          ...state,
          data: {
            ...state.data,
            list: newList,
  
          }
        };
      },
    },
  };  
`;
};
var routerPage = function (props) {
  return `import React, { PureComponent } from 'react';
  import { connect } from 'dva';
  import { Link } from 'dva/router';
  import { Form, Row, Col, Card, Modal, Button, Input, Popconfirm } from 'antd';
  import styles from './Index.less';

  import PageHeaderLayout from '../../layouts/PageHeaderLayout';
  import SearchForms from '../../components/GeneralSearchForm/Index';
  import TableList from '../../components/GeneralTableList/Index';
  import DetailFormInfo from './ModalDetailForm';

  import Authorized from '../../utils/Authorized';
  import { PageConfig } from './pageConfig.js';
  import { formaterObjectValue, formItemAddInitValue } from '../../utils/utils';

  const FormItem = Form.Item;

  @connect(state => ({
    currentUser: state.user.currentUser,
    ${props.name}: state.${props.name},
  }))
  @Form.create()
  export default class Index extends PureComponent {
    state = {
      modalVisible: false,
      showModalType: '',
      formValues: {},
      currentItem: {},
      detailFormItems: PageConfig.detailFormItems
    }
    constructor(props) {
      super(props);

    }
    componentDidMount() {
      const { dispatch } = this.props;
      dispatch({
        type: '${props.name}/fetch',
      });
    }
    renderSearchForm = () => {
      const { form, dispatch } = this.props;
      const { searchForms } = PageConfig;
      const props = {
        form,
        formInfo: {
          layout: 'inline',
          formItems: searchForms
        },
        handleSearchSubmit: (formValues) => {
          const { createtime, channeltype } = formValues;
          const params = Object.assign(formValues, {
            createtime: createtime ? createtime.format('YYYY-MM-DD') : '',
            channeltype: channeltype && channeltype.constructor.name === 'Object' ? channeltype.selectValue : ''
          });
          const payload = formaterObjectValue(params);
          this.setState({
            formValues: payload
          });
          dispatch({
            type: '${props.name}/fetch',
            payload
          });
        },
        handleFormReset: () => {
          this.setState({
            formValues: {}
          });
          dispatch({
            type: '${props.name}/fetch',
            payload: {}
          });
        }
      }
      return (
        <SearchForms {...props} />
      );
    }
    showModalVisibel = (type, record) => {
      const { detailFormItems } = this.state;
      const newDetailFormItems = formItemAddInitValue(detailFormItems, record);
      console.log(newDetailFormItems);
      this.setState({
        showModalType: type,
        modalVisible: true,
        currentItem: record,
        detailFormItems: newDetailFormItems
      });
    }
    hideModalVisibel = () => {
      this.setState({
        modalVisible: false,
        currentItem: {}
      });
    }
    deleteTableRowHandle = (id) => {
      this.props.dispatch({
        type: '${props.name}/remove',
        payload: { id }
      });
    }
    extraTableColumnRender = () => {
      const columns = [
        {
          title: '操作',
          render: (text, record) => (
            <div>
              <a onClick={() => { this.showModalVisibel('update', record) }}>编辑</a>
              &nbsp;
              <Popconfirm
                title="确定删除吗？"
                onConfirm={() => { this.deleteTableRowHandle(record.id) }}
              >
                <a>删除</a>
              </Popconfirm>
            </div>
          ),
        }
      ];
      return columns;
    }
    renderTable = () => {
      const { tableColumns } = PageConfig;
      const { data: { list, pagination }, loading } = this.props.${props.name};
      const newTableColumns = [...tableColumns, ...this.extraTableColumnRender()];
      const tableProps = {
        dataSource: list,
        columns: newTableColumns,
        pagination: Object.assign(pagination, { pageSize: 10 }),
        loading,
        handleTableChange: (current) => {
          const { dispatch } = this.props;
          const { formValues } = this.state;
          const payload = {
            page: current,
            pageSize: 10,
            ...formValues,
          };
          dispatch({
            type: '${props.name}/fetch',
            payload
          });

        },
        // size: 'small'
        bordered: false
      };
      return (<TableList {...tableProps} />);
    }
    modalOkHandle = () => {
      this.modalForm.validateFields((err, fieldsValue) => {
        if (err) return;
        logs('fieldsValue', fieldsValue);
        const { showModalType, currentItem } = this.state;
        if (showModalType === 'create') {
          this.props.dispatch({
            type: '${props.name}/add',
            payload: fieldsValue
          });
        } else if (showModalType === 'update') {
          this.props.dispatch({
            type: '${props.name}/update',
            payload: Object.assign(currentItem, fieldsValue)
          });
        }

        this.hideModalVisibel();
      });
    }
    render() {
      const { modalVisible, detailFormItems } = this.state;
      const modalWidth = document.documentElement.clientWidth - 300;
      const { form: { getFieldDecorator }, currentUser: { btnAuth = [] } } = this.props;

      return (
        <PageHeaderLayout>
          <Card bordered={false}>
            <div className={styles.tableList}>
              <div className={styles.tableListForm}>
                {this.renderSearchForm()}
                <div className={styles.tableListOperator}>
                  <Authorized authority={() => ~btnAuth.indexOf('新建渠道')} >
                    <Button icon="plus" type="primary" onClick={() => this.showModalVisibel('create', {})}>
                      新建
                  </Button>
                  </Authorized>
                </div>
                {this.renderTable()}
              </div>
            </div>
          </Card>
          <Modal
            // width={modalWidth}
            destroyOnClose={true}
            visible={modalVisible}
            onCancel={() => this.hideModalVisibel()}
            onOk={() => { this.modalOkHandle() }}

          >
            <DetailFormInfo
              ref={ref => { this.modalForm = ref }}
              formItems={detailFormItems}
            />
          </Modal>
        </PageHeaderLayout>
      );
    }
  }
  `;
}
var routerPageLess = function (props) {
  return `
  @import "~antd/lib/style/themes/default.less";
  @import "../../utils/utils.less";
  .tableList {
    .tableListOperator {
      margin-bottom: 16px;
      button {
        margin-right: 8px;
      }
    }
  }
  .tableListForm {
    :global {
      .ant-form-item {
        margin-bottom: 24px;
        margin-right: 0;
        display: flex;
        > .ant-form-item-label {
          // width: auto;
          // line-height: 32px;
          padding-right: 8px;
        }
      }
      .ant-form-item-control-wrapper {
        flex: 1;
      }
    }
    .submitButtons {
      white-space: nowrap;
      margin-bottom: 24px;
    }
  }
  
  @media screen and (max-width: @screen-lg) {
    .tableListForm :global(.ant-form-item) {
      margin-right: 24px;
    }
  }
  
  @media screen and (max-width: @screen-md) {
    .tableListForm :global(.ant-form-item) {
      margin-right: 8px;
    }
  }
  `;
}
var pageConfig = function (props) {
  return `
  import { Icon } from 'antd';
  export const PageConfig = {
    name: 'test页',
    path: 'table-test',
    tableColumns: [{
      title: '序号',
      dataIndex: 'id'
    }, {
      title: '渠道名称',
      dataIndex: 'channelname'
    }, {
      title: '合作状态',
      dataIndex: 'cooperationstatus'
    }, {
      title: '渠道类型',
      dataIndex: 'channeltype'
    }, {
      title: '渠道来源',
      dataIndex: 'channelsource'
    }, {
      title: '地区名称',
      dataIndex: 'city'
    }, {
      title: '渠道性质',
      dataIndex: 'channelnature',
      render: (text, record, index) => {
        if (text == 0) {
          return '直营';
        } else {
          return '非直营';
        }
      }
    }, {
      title: '状态',
      dataIndex: 'status',
      render: (text, record, index) => {
        if (text == 1) {
          return (<Icon type="check-circle" style={{ color: '#52c41a' }} />);
        } else {
          return (<Icon type="close-circle" style={{ color: '#f5222d' }} />);
        }
      }
    }, {
      title: '创建时间',
      dataIndex: 'createtime'
    },],
    searchForms: [{
      formType: 'input',
      disabled: false,
      isRequired: false,
      key: 'channelname',
      label: '渠道名称',
      placeholder: '渠道名称'
    }, {
      formType: 'select',
      disabled: false,
      isRequired: false,
      key: 'cooperationstatus',
      label: '合作状态',
      placeholder: '合作状态',
      dataType: 'static',
      selectOptions: [{
        key: '直营',
        value: '直营'
      }, {
        key: '小商户',
        value: '小商户'
      }],
    }, {
      formType: 'selectDynamic',
      disabled: false,
      isRequired: false,
      key: 'channeltype',
      label: '渠道类型',
      placeholder: '渠道类型',
      dataType: 'dynamic',
      dictionaryKey: 'selectLists2',
      fetchUrl: '/api/selectLists2'
    }, {
      formType: 'select',
      disabled: false,
      isRequired: false,
      key: 'channelsource',
      label: '渠道来源',
      placeholder: '渠道来源',
      dataType: 'static',
      selectOptions: [{
        key: '官网',
        value: '官网'
      }, {
        key: '百度',
        value: '百度'
      }, {
        key: '400介绍',
        value: '400介绍'
      }, {
        key: '老客户',
        value: '老客户'
      }],
    }, {
      formType: 'select',
      disabled: false,
      isRequired: false,
      key: 'channelnature',
      label: '渠道性质',
      placeholder: '渠道性质',
      dataType: 'static',
      selectOptions: [{
        key: 0,
        value: '直营'
      }, {
        key: 1,
        value: '非直营'
      }],
    }, {
      formType: 'datePicker',
      disabled: false,
      isRequired: false,
      key: 'createtime',
      label: '创建时间',
      placeholder: '请选择日期',
    }, {
      formType: 'select',
      disabled: false,
      isRequired: false,
      key: 'status',
      label: '状态',
      placeholder: '状态',
      dataType: 'static',
      selectOptions: [{
        key: 1,
        value: '通过'
      }, {
        key: 0,
        value: '拒绝'
      }],
      popupContainer: 'scorllArea'

    }
    ],
    detailFormItems: [{
      formType: 'input',
      disabled: false,
      isRequired: true,
      key: 'channelname',
      label: '渠道名称',
      placeholder: '渠道名称',
      colSpan: 24
    }, {
      formType: 'select',
      disabled: false,
      isRequired: true,
      key: 'cooperationstatus',
      label: '合作状态',
      placeholder: '合作状态',
      dataType: 'static',
      selectOptions: [{
        key: '直营',
        value: '直营'
      }, {
        key: '小商户',
        value: '小商户'
      }],
      colSpan: 24

    }, {
      formType: 'select',
      disabled: false,
      isRequired: true,
      key: 'channeltype',
      label: '渠道类型',
      placeholder: '渠道类型',
      dataType: 'static',
      selectOptions: [{
        key: '广告',
        value: '广告'
      }, {
        key: '网络',
        value: '网络'
      }, {
        key: '中介',
        value: '中介'
      }, {
        key: '其他',
        value: '其他'
      }],
      colSpan: 24

    }, {
      formType: 'select',
      disabled: false,
      isRequired: true,
      key: 'channelsource',
      label: '渠道来源',
      placeholder: '渠道来源',
      dataType: 'static',
      selectOptions: [{
        key: '官网',
        value: '官网'
      }, {
        key: '百度',
        value: '百度'
      }, {
        key: '400介绍',
        value: '400介绍'
      }, {
        key: '老客户',
        value: '老客户'
      }],
      colSpan: 24

    }, {
      formType: 'select',
      disabled: false,
      isRequired: true,
      key: 'channelnature',
      label: '渠道性质',
      placeholder: '渠道性质',
      dataType: 'static',
      selectOptions: [{
        key: 0,
        value: '直营'
      }, {
        key: 1,
        value: '非直营'
      }],
      colSpan: 24

    }, {
      formType: 'select',
      disabled: false,
      isRequired: true,
      key: 'status',
      label: '状态',
      placeholder: '状态',
      dataType: 'static',
      selectOptions: [{
        key: 1,
        value: '通过'
      }, {
        key: 0,
        value: '拒绝'
      }],
      colSpan: 24

    },
    {
      formType: 'textArea',
      disabled: false,
      isRequired: true,
      key: 'description',
      label: '备注',
      placeholder: '备注',
      autosize: { minRows: 5, maxRows: 10 },
      colSpan: 24
    }]
  };
  `;
}
var modalDetailFormPage = function (props) {
  return `
  import React, { PureComponent } from 'react';
  import { connect } from 'dva';
  import { Form, Row, Col, Card, Button, Input, Tabs } from 'antd';

  import { renderFormItem } from '../../common/formItem';
  import { FormItems } from './pageConfig';
  const FormItem = Form.Item;
  const TabPane = Tabs.TabPane;
  const formItemLayout = {
    labelCol: {
      span: 6,
    },
    wrapperCol: {
      span: 18,
    }
  };
  @Form.create()
  export default class DetailFormInfo extends PureComponent {
    constructor(props) {
      super(props);
    }
    renderFormItem = () => {
      const { formItems, dispatch, form } = this.props;
      return formItems.map((item, i) => {
        const InputType = renderFormItem(item, form);
        return (
          <Col lg={item.colSpan || 8} md={12} sm={24} key={\`\${item.key} _\${i}\` } >
            <FormItem
              label={\`\${item.label} \`}
              {...formItemLayout}
              hasFeedback
            >
              {InputType}
            </FormItem>
          </Col>
        );
      });
    }
    render() {
      return (
        <Card bordered={false} loading={false}>
          <Form>
            <Row gutter={24}>
              {this.renderFormItem()}
            </Row>
          </Form>
        </Card>

      );
    }



  }
  `;
}
var mockData = function (props) {
  return `
  'use strict';
    const qs = require('qs');
    const mockjs = require('mockjs');
    const jsonQuery = require('json-query');
    function getNowFormatDate() {
      var date = new Date();
      var seperator1 = "-";
      var seperator2 = ":";
      var month = date.getMonth() + 1;
      var strDate = date.getDate();
      if (month >= 1 && month <= 9) {
        month = "0" + month;
      }
      if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
      }
      var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate + " " + date.getHours() + seperator2 + date.getMinutes() + seperator2 + date.getSeconds();
      return currentdate;
    }
    const uniqueFileds = [];
    let helper = {};
    // 数据持久
    let tableListSys_${props.name}Data = {};
    if (!global.tableListSys_${props.name}Data) {
      const data = mockjs.mock({
        'data|50': [{
          'id|+1': 1,
          'ordernum|+1': 1,
          'channelname|1': '@cword(4)',
          'cooperationstatus|1': ['直营', '小商户'],
          'channeltype|1': ['广告', '网络', '中介', '其他'],
          'channelsource|1': ['官网', '百度', '400介绍', '老客户'],
          'city|1': '@city()',
          'channelnature|1': [0, 1],//['直营0', '非直营1']
          'status|1': [0, 1],
          'createtime|1': '@datetime("2017-12-dd")',
          'description|1': '@csentence'
        }],
        page: {
          total: 50,
          current: 1
        }
      });
      tableListSys_${props.name}Data = data;
      global.tableListSys_${props.name}Data = tableListSys_${props.name}Data;
    } else {
      tableListSys_${props.name}Data = global.tableListSys_${props.name}Data;
    }
    module.exports = {
      'GET /api/sys_channel'(req, res) {
        const page = qs.parse(req.query);
        const pageSize = page.pageSize - 0 || 10;
        const currentPage = page.page - 0 || 1;
        let data;
        let newPage;
        if (page[uniqueFileds[0]] || page[uniqueFileds[1]]) {
          let queryKey = '';
          let queryValue = '';
          if (page[uniqueFileds[0]]) {
            queryKey = uniqueFileds[0];
            queryValue = page[uniqueFileds[0]];
          } else {
            queryKey = uniqueFileds[1];
            queryValue = page[uniqueFileds[1]];
          }
          let queryData = jsonQuery(\`data[\${queryKey}=\${queryValue}]\`, {
            data: tableListSys_${props.name}Data
          }).value;
          let resultArray = [];
          if (queryData) {
            resultArray.push(queryData);
          }
          data = resultArray.slice((currentPage - 1) * pageSize, currentPage * pageSize);
          newPage = {
            current: currentPage * 1,
            total: resultArray.length
          };
        } else {
          let keys = [];
          let flag = false;
          for (let o in page) {
            if (page.hasOwnProperty(o) && page[o] && o !== 'page' && o !== 'pageSize') {
              if (!flag) { // 判断如果是第一个参数，就加上一个*（表示查询全部，这个*号只能加一次，否则查询失败）
                keys.push(\`*\${o}=\${page[o] || ''}\`);
                flag = true;
              } else {
                keys.push(\`\${o}=\${page[o] || ''}\`);
              }
            }
          }
          if (keys.length > 0) {
            const queryKeys = keys.join('&');
            let queryData = jsonQuery(\`data[\${queryKeys}]\`, {
              data: tableListSys_${props.name}Data,
              locals: helper
            }).value;
            data = queryData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            newPage = {
              current: currentPage * 1,
              total: queryData.length
            };
          } else {
            data = tableListSys_${props.name}Data.data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            tableListSys_${props.name}Data.page.current = currentPage * 1;
            newPage = {
              current: tableListSys_${props.name}Data.page.current,
              total: tableListSys_${props.name}Data.page.total
            };
            // console.log('newPage',newPage)
          }
        }
        res.json({
          status: 200,
          body: {
            list: data,
            pagination: newPage
          },
          errorMes: ''

        });

      },
      'POST /api/sys_channel'(req, res) {
        const newData = qs.parse(req.body);
        const pageSize = 10;
        const currentPage = 1;
        let data;
        let newPage;
        newData.id = tableListSys_${props.name}Data.data.length + 1;
        newData.createtime = mockjs.mock('@datetime("2017-12-dd")');
        newData.city = mockjs.mock('@city()');
        tableListSys_${props.name}Data.data.unshift(newData);

        data = tableListSys_${props.name}Data.data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        tableListSys_${props.name}Data.page.current = 1;
        tableListSys_${props.name}Data.page.total = tableListSys_${props.name}Data.data.length;
        newPage = {
          current: 1,
          total: tableListSys_${props.name}Data.page.total
        };
        global.tableListSys_${props.name}Data = tableListSys_${props.name}Data;
        res.status(201);
        res.json({
          status: 201,
          body: {
            list: data,
            pagination: newPage
          },
          errorMes: ''
        });
      },
      'DELETE /api/sys_channel'(req, res) {
        const deleteItem = qs.parse(req.body);
        console.log('deleteItem', deleteItem);
        tableListSys_${props.name}Data.data = tableListSys_${props.name}Data.data.filter(function (item) {
          if (item.id == deleteItem.id) {
            return false;
          }
          return true;
        });
        tableListSys_${props.name}Data.page.total = tableListSys_${props.name}Data.data.length;
        global.tableListSys_${props.name}Data = tableListSys_${props.name}Data;
        res.json({
          status: 204,
          body: {},
          errorMes: ''
        });
      },
      'PUT /api/sys_channel'(req, res) {
        const editItem = qs.parse(req.body);
        console.log('editItem', editItem)
        tableListSys_${props.name}Data.data = tableListSys_${props.name}Data.data.map(function (item) {
          if (item.id == editItem.id) {
            return {
              ...item,
              ...editItem
            };
          }
          return item;
        });

        global.tableListSys_${props.name}Data = tableListSys_${props.name}Data;
        res.status(202)
        res.json({
          status: 202,
          body: editItem,
          errorMes: ''

        });
      }
    };
  `;
}
module.exports = {
  routerPage,
  routerPageLess,
  pageConfig,
  modalDetailFormPage,
  mockData,
  model
};
