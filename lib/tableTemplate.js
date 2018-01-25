var model = function (props) {
  return `import { create, query, update, remove } from '../services/generalApi';
  import { message } from 'antd';
  export default {
    namespace: '${props.name}',
    state: {
      data: {
        list: [],
        pagination: {},
      }
    },
  
    effects: {
      *fetch({ payload }, { call, put }) {
        const response = yield call(query, payload, '/api/sys_${props.name}');
        const { status, body, errorMes = '' } = response;
        yield put({
          type: 'save',
          payload: body,
        });
      },
      *update({ payload }, { call, put, select }) {
        const page = yield select(state => state.${props.name}.data.pagination.current);
        Object.assign(payload, { page });
        const response = yield call(update, payload, '/api/sys_${props.name}');
        const { status, body, errorMes = '' } = response;
        message.success('修改成功');
        yield put({
          type: 'save',
          payload: body,
        });
      },
      *add({ payload, callback }, { call, put }) {
        const response = yield call(create, payload, '/api/sys_${props.name}');
        const { status, body, errorMes = '' } = response;
        message.success('添加成功');
        yield put({
          type: 'save',
          payload: body,
        });
      },
      *remove({ payload }, { call, put, select }) {
        const page = yield select(state => state.${props.name}.data.pagination.current);
        Object.assign(payload, { page });
        const response = yield call(remove, payload, '/api/sys_${props.name}');
        const { status, body, errorMes = '' } = response;
        message.success('删除成功');
        yield put({
          type: 'save',
          payload: body,
        });
      },
    },
  
    reducers: {
      save(state, action) {
        return {
          ...state,
          data: action.payload,
        };
      }
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

  @connect(({ user, ${props.name}, loading }) => ({
    currentUser: user.currentUser,
    ${props.name},
    loading: loading.models.${props.name}
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
      const { ${props.name}, loading } = this.props;
      const { tableColumns } = PageConfig;
      const { data: { list, pagination } } = ${props.name};
      const newTableColumns = [...tableColumns, ...this.extraTableColumnRender()];
      const tableProps = {
        loading,
        dataSource: list,
        columns: newTableColumns,
        pagination: Object.assign(pagination, { pageSize: 10 }),
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
    const createData = function (status = 200, pageNum = 1, pageSize = 10, ) {
      const mockData = {};
      const dataList = mockjs.mock({
        [\`data|\${ pageSize }\]: [{
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
        status,
        body: {
          list: data,
          pagination
        },
        errorMes: ''
      });
      return mockData;
    }
    module.exports = {
      'GET /api/sys_${props.name}'(req, res) {
        const params = qs.parse(req.query);
        const pageSize = params.pageSize - 0 || 10;
        const page = params.page - 0 || 1;
        const status = 200;
        const mockData = createData(status, page, pageSize);
        res.json(mockData);
      },
      'POST /api/sys_${props.name}'(req, res) {
        const params = qs.parse(req.body);
        const status = 201;
        const mockData = createData(status);
        res.json(mockData);
      },
      'PUT /api/sys_${props.name}'(req, res) {
        const params = qs.parse(req.body);
        const { id, page = 1 } = params;
        const status = 201;
        const mockData = createData(status, page);
        res.json(mockData);
      },
      'DELETE /api/sys_${props.name}'(req, res) {
        const params = qs.parse(req.body);
        const { id, page = 1 } = params;
        const status = 204;
        const mockData = createData(status, page);
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
