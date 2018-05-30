var model = function (props) {
  return `import {
    create,
    query,
    update,
    remove,
    queryPost
  } from "../services/generalApi";
  import { showStautsMessageHandle } from "../utils/statusCode";
  export default {
    namespace: "${props.name}",
    state: {
      data: {
        list: [],
        pagination: {}
      },
      modalVisible: false,
      confirmLoading: false
    },
  
    effects: {
      *fetch({ payload }, { call, put }) {
        const response = yield call(queryPost, payload, "/sys/${props.name}/list");
        if (response) {
          const { code , body, message = "" } = response;
          if(code === 200){
            yield put({
              type: "save",
              payload: {
                data: body
              }
            });
          }
          
        }else{
          showStautsMessageHandle('error');
        }
      },
      *update({ payload }, { call, put, select }) {
        yield put({
          type: "changgeConfirmLoading",
          payload: {
            confirmLoading: true
          }
        });
        const page = yield select(
          state => state.${props.name}.data.pagination.current
        );
        Object.assign(payload, { page });
        const response = yield call(update, payload, "/sys/${props.name}/update");
        yield put({
          type: "changgeConfirmLoading",
          payload: {
            confirmLoading: false
          }
        });
        if (response) {
          const { code , body, message = "" } = response;
          if (code === 200) {
            yield put({
              type: "modalVisible",
              payload: {
                modalVisible: false
              }
            });
            yield put({
              type: "save",
              payload: {
                data: body
              }
            });
          }
          showStautsMessageHandle("general", "update", code);
        } else {
          showStautsMessageHandle("error");
        }
      },
      *add({ payload, callback }, { call, put }) {
        yield put({
          type: "changgeConfirmLoading",
          payload: {
            confirmLoading: true
          }
        });
        const response = yield call(create, payload, "/sys/${props.name}/save");
        yield put({
          type: "changgeConfirmLoading",
          payload: {
            confirmLoading: false
          }
        });
        if (response) {
          const { code , body, message = "" } = response;
          if (code === 200) {
            yield put({
              type: "modalVisible",
              payload: {
                modalVisible: false
              }
            });
            yield put({
              type: "save",
              payload: {
                data: body
              }
            });
          }
          showStautsMessageHandle("general", "add", code);
        } else {
          showStautsMessageHandle("error");
        }
      },
      *remove({ payload }, { call, put, select }) {
        const page = yield select(
          state => state.${props.name}.data.pagination.current
        );
        Object.assign(payload, { page });
        const response = yield call(remove, payload, "/sys/${props.name}/del");
        if (response) {
          const { code , body, message = "" } = response;
          if (code === 200) {
            yield put({
              type: "save",
              payload: {
                data: body
              }
            });
          } 
          showStautsMessageHandle("general", "delete", code);
        }else{
          showStautsMessageHandle('error');
        }
      }
    },
  
    reducers: {
      modalVisible(state, { payload }) {
        return {
          ...state,
          ...payload
        };
      },
      changgeConfirmLoading(state, { payload }) {
        return {
          ...state,
          ...payload
        };
      },
      save(state, action) {
        return {
          ...state,
          ...action.payload,
        };
      }
    }
  };
  
`;
};
var routerPage = function (props) {
  return `import React, { PureComponent } from 'react';
  import { connect } from 'dva';
  import { Link } from 'dva/router';
  import { Form, Row, Col, Card, Modal, Button, Input, Popconfirm } from 'antd';
  import styles from './Index.less';
  import cloneDeep from "lodash/cloneDeep";

  import PageHeaderLayout from '../../layouts/PageHeaderLayout';
  import SearchForms from '../../components/GeneralSearchForm/Index';
  import TableList from '../../components/GeneralTableList/Index';
  import DetailFormInfo from './ModalDetailForm';

  import Authorized from '../../utils/Authorized';
  import { PageConfig } from './pageConfig.js';
  import { formaterObjectValue, formItemAddInitValue } from '../../utils/utils';

  const FormItem = Form.Item;

  @connect(({ user, ${props.name}, loading }) => ({
    currentUser: user.currentUser,
    ${props.name},
    loading: loading.models.${props.name}
  }))
  @Form.create()
  export default class Index extends PureComponent {
    state = {
      showModalType:'',
      formValues: {},
      queryValues: {},
      detailFormItems: PageConfig.detailFormItems
    }
    componentDidMount() {
      const { dispatch } = this.props;
      dispatch({
        type: '${props.name}/fetch',
        payload: this.queryParamsFormater()
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
            queryValues: payload
          });
          dispatch({
            type: '${props.name}/fetch',
            payload: this.queryParamsFormater(payload, 1)
          });
         
        },
        handleFormReset: () => {
          this.setState({
            queryValues: {}
          });
          dispatch({
            type: '${props.name}/fetch',
            payload: this.queryParamsFormater()
          });
        }
      }
      return (
        <SearchForms {...props} />
      );
    }
    queryParamsFormater = (fields, type) => {
      // type 1:查询  2:update|delete  3:save  4:分页
      const { data: { pagination } } = this.props.${props.name};
      delete pagination.total;
      let params = {
        form: {},
        query: {},
        pagination: {
          current: 1,
          pageSize: 10
        }
      };
      switch (type) {
        case 1:
          Object.assign(params, {
            query: { ...fields },
            pagination
          });
          break;
        case 2:
          Object.assign(params, {
            query: { ...this.state.queryValues },
            form: { ...fields },
            pagination
          });
          break;
        case 3:
          Object.assign(params, {
            form: { ...fields }
          });
          break;
        case 4:
          Object.assign(params, {
            query: { ...this.state.queryValues },
            pagination: { current: fields.page, pageSize: fields.pageSize }
          });
          break;
        default:
          Object.assign(params, {});
      }
      return params;
    };
    updateFormItems = (type = "create", record = {}) => {
      const detailFormItems = cloneDeep(PageConfig.detailFormItems);
      const newDetailFormItems = formItemAddInitValue(detailFormItems, record);
      this.setState({ detailFormItems });
    };
    changeModalVisibel = flag => {
      this.props.dispatch({
        type: "${props.name}/modalVisible",
        payload: {
          modalVisible: flag
        }
      });
    };
    showModalVisibel = (type, record) => {
      this.updateFormItems(type, record);
      this.changeModalVisibel(true);
      this.setState({
        showModalType:type
      });
    }
    hideModalVisibel = () => {
      this.changeModalVisibel(false);
    }
    deleteTableRowHandle = (id) => {
      this.props.dispatch({
        type: '${props.name}/remove',
        payload: this.queryParamsFormater({ id }, 2)
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
      const { ${props.name}, loading } = this.props;
      const { tableColumns } = PageConfig;
      const { data: { list, pagination } } = ${props.name};
      const newTableColumns = [...tableColumns, ...this.extraTableColumnRender()];
      const tableProps = {
        loading,
        dataSource: list,
        columns: newTableColumns,
        pagination: Object.assign(pagination, { pageSize: 10 }),
        handleTableChange: ({current}) => {
          const { dispatch } = this.props;
          const { formValues } = this.state;
          const payload = {
            page: current,
            pageSize: 10,
            ...formValues,
          };
          dispatch({
            type: '${props.name}/fetch',
            payload: this.queryParamsFormater(payload, 4)
          });

        },
        bordered: false
      };
      return (<TableList {...tableProps} />);
    }
    modalOkHandle = () => {
      this.modalForm.validateFields((err, fieldsValue) => {
        if (err) return;
        const { showModalType } = this.state;
        const fields = formaterObjectValue(fieldsValue);
        if (showModalType === 'create') {
          this.props.dispatch({
            type: '${props.name}/add',
            payload: this.queryParamsFormater(fields, 3)
          });
        } else if (showModalType === 'update') {
          this.props.dispatch({
            type: '${props.name}/update',
            payload: this.queryParamsFormater(fields, 2)
          });
        }

      });
    }
    render() {
      const {  detailFormItems } = this.state;
      const modalWidth = document.documentElement.clientWidth - 300;
      const { form: { getFieldDecorator }, currentUser: { btnAuth = [] },${props.name}: { modalVisible, confirmLoading } } = this.props;

      return (
        <PageHeaderLayout>
          <Card bordered={false}>
            <div className={styles.tableList}>
              <div className={styles.tableListForm}>
                {this.renderSearchForm()}
                <div className={styles.tableListOperator}>
                <Button icon="plus" type="primary" onClick={() => this.showModalVisibel('create', {})}>
                    新建
                </Button>
                </div>
                {this.renderTable()}
              </div>
            </div>
          </Card>
          <Modal
            // width={modalWidth}
            destroyOnClose={true}
            visible={modalVisible}
            confirmLoading={confirmLoading}
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
    const createData = function (code = 200, pageNum = 1, pageSize = 10, ) {
      const mockData = {};
      const dataList = mockjs.mock({
        [\`data|\${ pageSize }\`]: [{
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
        pagination: {
          total: pageSize * 5,
          current: pageNum
        }
      });
      const { data, pagination } = dataList;
      Object.assign(mockData, {
        code,
        body: {
          dictionary:{},
          extra:{},
          list: data,
          pagination
        },
        message: ''
      });
      return mockData;
    }
    module.exports = {
      'POST /sys/${props.name}/list'(req, res) {
        const {form,query,pagination:{pageSize=10,current=1}} = qs.parse(req.body);
        const mockData = createData(200,current,pageSize);
        res.json(mockData);
      },
      'POST /sys/${props.name}/save'(req, res) {
        const {form,query,pagination:{pageSize=10,current=1}} = qs.parse(req.body);
        const mockData = createData(200,current,pageSize);
        res.json(mockData);
      },
      'POST /sys/${props.name}/update'(req, res) {
        const {form,query,pagination:{pageSize=10,current=1}} = qs.parse(req.body);
        const mockData = createData(200,current,pageSize);
        res.json(mockData);
      },
      'POST /sys/${props.name}/del'(req, res) {
        const {form,query,pagination:{pageSize=10,current=1}} = qs.parse(req.body);
        const mockData = createData(200,current,pageSize);
        res.json(mockData);
      },
      
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
