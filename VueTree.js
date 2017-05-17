/**
 * Created by Golf on 2017/4/17.
 */

//获取元素的纵坐标（相对于窗口）
function getTop(e) {
    var offset = e.offsetTop;
    if (e.offsetParent != null) offset += getTop(e.offsetParent);
    return offset;
}

//获取元素的横坐标（相对于窗口）
function getLeft(e) {
    var offset = e.offsetLeft;
    if (e.offsetParent != null) offset += getLeft(e.offsetParent);
    return offset;
}
//递归找出该元素的所有子元素,以及其本身
function getNodesByDatas(arr, datas) {
    arr.push(datas);
    if (datas.children.length) {//如果有儿子
        for (var i = 0; i < datas.children.length; i++) {
            var child = datas.children[i];  //儿子元素
            getNodesByDatas(arr, child);
        }
    }
}


//递归找出该元素的所有父级元素,不包括自身
function getParents(arr, comp) {
    // console.log(comp.$parent ? 'true' : 'false');
    if (comp.$parent) {
        // console.log(comp.$parent.item)
        if (comp.$parent.item) {
            arr.push(comp.$parent.item);
        }
        getParents(arr, comp.$parent);
    }

}

//checkbox 点击后找到所有子组件,选中或取消
function getCheckSon(data, ischoose) {
    if (data.length) {//如果有儿子
        for (var i = 0; i < data.length; i++) {
            data[i].$data.ischeck = ischoose;
            getCheckSon(data[i].$children, ischoose);
        }
    }
}

//checkbox 点击后找到所有父组件,选中或取消
function getParentNode(data, ischoose) {
    if (data) {//如果有父组件

        var siblings = data.$children;//兄弟节点

        var flag = false;

        if (!ischoose) { //如果是取消选择 checkbox
            for (var i = 0; i < siblings.length; i++) {
                if (siblings[i].$data.ischeck) {
                    //如果有兄弟节点有选中
                    flag = true;
                    break;
                } else {
                    //这里是没选中的兄弟节点,可做删除操作
                }
            }
            if (flag) {
                //父组件的
                data.$data.ischeck = true;
            } else {
                data.$data.ischeck = ischoose;
                //这里可以移除父节点
            }
        } else {
            //如果是选中,父节点选中
            data.$data.ischeck = ischoose;
        }

        getParentNode(data.$parent, ischoose);


    }

};


//将对象元素转换成字符串以作比较
function obj2key(obj, keys) {
    var n = keys.length,
        key = [];
    while (n--) {
        key.push(obj[keys[n]]);
    }
    return key.join('|');
}
//去重操作
function uniqeByKeys(array, keys) {
    var arr = [];
    var hash = {};
    for (var i = 0, j = array.length; i < j; i++) {
        var k = obj2key(array[i], keys);
        // console.log(k + '  --->  ', hash)
        // console.log((k in hash))
        if (!(k in hash)) {
            hash[k] = true;
            arr.push(array[i]);
        }
    }
    return arr;
}


//单一事件管理 -- > 传递组件间的变量
var events = new Vue();

Vue.directive('hover', {
    // 当绑定元素插入到DOM中
    bind: function (el, binding) {
        var span = el;

        document.addEventListener('click', function (ev) {

            var meun = document.getElementById('meuns');
            meun.style.display = 'none';
            ev.stopPropagation();
        });
        span.addEventListener('contextmenu', function (ev) {
            var oleft = getLeft(span); //相对于窗口的left
            var otop = getTop(span);   //相对于窗口的top
            var x = oleft + span.clientWidth;
            var y = otop + (span.clientHeight / 2);

            var meun = document.getElementById('meuns');
            meun.style.display = 'block';
            var meunHeight = meun.clientHeight;
            meun.style.top = (y - (meunHeight / 2)) + 'px';
            meun.style.left = x + 'px';

            events.$emit('contextData', binding.value);
            //为了右键后给改span 增加active效果
            events.$emit('changeCurrId', binding.value.id);
            ev.stopPropagation();
            ev.preventDefault();
        });

    }
});

var treecontent = Vue.component('treecontent', {
    template: '#treecontent',
    props: ['item', 'currid', 'click', 'checkbox', 'checkeditems'],
    data: function () {
        return {
            show: false,
            open: false,
            ischeck: false
        }
    },
    methods: {
        toggle: function (node) {
            if (node.pid == 0) return;


            if (this.open && this.show) {
                //如果open为true , 而且 选中的span是当前的,open为true
                this.open = false;
            } else { //否则,toggle
                this.open = true;
            }


            this.currid.isOpen = true;
            //给接受该事件的元素 自定义一个方法,show ,当触发时候 ,看mouned 里面的$on方法 ,取消其他节点的展开
            events.$emit('show', node);
            //同时只能打开一个组件

            //父组件的show  open 为真
            this.$parent.$data.show = true;
            this.$parent.$data.open = true;
            this.show = !this.show;
            this.currid.currIndex = node.id;
            this.click ? this.click(node) : '';
        },
        ischeckBox: function (node) {

            this.ischeck = !this.ischeck;
            //全部子元素要么选中,要么全部不选  (这里写得不好,只能二级节点正确,正确写法是要递归全部子元素去判断)
            var datas = this.$children;

            //递归找出该元素的所有子元素,以及其本身
            getCheckSon(this.$children, this.ischeck)


            getParentNode(this.$parent, this.ischeck)


            if (this.ischeck) { //如果是选中

                var childs = [];
                getNodesByDatas(childs, node);  //1 得到本次选中的节点,以及其子集

                var parents = [];
                getParents(parents, this);      //2 本次选中的所有父级节点 ,不包括自身

                //3 合并父子数组 -->到子数组里面,
                for (var i = 0; i < parents.length; i++) {
                    childs.push(parents[i])
                }

                for (var i = 0; i < childs.length; i++) {  //4 存checkeditems.allItems
                    this.checkeditems.allItems.push(childs[i]);
                }
                var saveData = uniqeByKeys(this.checkeditems.allItems, ['id']);
                //去重
                this.$set(this.checkeditems, 'allItems', saveData);

            } else {
                //如果是取消选中
                //1 得到本身以及所有子元素的数据   childs
                var childs = [];
                getNodesByDatas(childs, node);
                //2 判断每层(递归)兄弟节点是否有选中  没有选中则得到-->所有父级节点,删除所有父级节点, parents
                var parents = [];
                sublingsIschecked(parents, this);
                function sublingsIschecked(arr, comp) {
                    var sublings = comp.$parent.$children; //兄弟节点
                    // console.log('有几个兄弟  --> ' + sublings.length)
                    for (var i = 0; i < sublings.length; i++) {
                        if (sublings[i].$data.ischeck) {
                            return arr = [];    //如果有兄弟节点有选中则 返回空
                        }
                    }
                    getParents(arr, comp);      //如果没兄弟节点选中,则返回所有父节点
                }


                //3 合并父子数组 -->到子数组里面,
                for (var i = 0; i < parents.length; i++) {
                    childs.push(parents[i])
                }
                // console.log(childs)
                //4 checkeditems.allItems 删除以上节点
                var all = this.checkeditems.allItems;

                for (var i = 0; i < all.length; i++) {
                    var temp = all[i];

                    for (var j = 0; j < childs.length; j++) {
                        if (temp.pid != '0' && temp.id == childs[j].id) { //如果pid !=0 而且all 里面有childs(取消里面计算的元素)
                            // console.log('temp - ' +temp.name + '   ' + childs[j].name)
                            this.checkeditems.allItems.splice(i, 1);      //则在all里面删除该元素  (不删除顶级元素)
                            i--;
                        }
                    }
                }
                // console.log('--------------------------------------------------')
                //5是否删除顶级父级元素
                var all = this.checkeditems.allItems;

                for (var i = 0; i < all.length; i++) {

                    var temp = all[i];
                    if (temp.pid == '0') { //如果存在顶级元素
                        var flag = true;
                        for (var j = 0; j < all.length; j++) {
                            if (temp.id = all[j].pid) { //如果存在顶级元素的二级子元素 不删除顶级父元素
                                flag = false;
                                break;
                            }
                        }

                        if (flag) {    //如果不存在二级节点,删除顶级父元素
                            this.checkeditems.allItems.splice(i, 1);
                            break;
                        }
                    }

                }
            }


            this.$set(this.checkeditems, 'currChecked', node);

            events.$emit('checkClick', this.checkeditems);


        }
    },
    computed: {
        clazz: function () { //图标class
            return {
                'glyphicon': true,  //icon必须
                'glyphicon-sort-by-attributes': this.isfirst, //顶级节点元素 专用 图标
                //如果 有子节点 和 不是顶级节点,而且
                'glyphicon-plus': (this.item.children.length && !this.isfirst), //父级节点元素 图标 目前为 +
                'glyphicon-minus': ((this.currid.isOpen && this.item.pid != 0 && this.currid.isOpen) && !this.isfirst && this.open && this.show), // 点开父级元素的图标 目前为 -
                'glyphicon-leaf': this.islast        //没有子元素的 图标  目前为叶子
            }
        },
        islast: function () {
            return !this.item.children.length;//判断是否没有子节点的 --> 最后元素
        },
        isfirst: function () {
            return this.item.pid == 0 ? true : false; // 是否为顶级元素   pid 为0,是约定规矩
        },
        isShow: function () { //用于判断子节点是否显示
            return this.item.id == this.currid.currIndex ? true : false;
        },
        ulIsShow: function () {
            return ((this.item.pid != 0 && this.currid.isOpen && this.open && this.show) || this.isfirst);
        }
    },
    updated: function () { //2.0新增钩子,视图触发更新后,则自动执行该方法
        //视图更新过后 全局的currid.isOpen = false; 这样再次点击后,图标 + 和 -正常
        // this.show = false;
    },
    mounted: function () {
        events.$on('show', function (node) {
            this.show = false;
            // this.open = false;
        }.bind(this));

    }
});


var mytree = Vue.component('mytree', {
    template: '#mytree',
    props: ['node', 'click', 'add', 'edit', 'del', 'checkbox', 'clickcheckbox'],
    data: function () {
        return {
            curr: {
                currIndex: '-1',
                isOpen: false
            },
            contextData: {},
            checkItems: {
                allItems: [],
                currChecked: {},
            }

        }
    },
    methods: {
        addos: function () {
            this.add ? this.add(this.contextData) : '';
        },
        editos: function () {
            this.edit ? this.edit(this.contextData) : '';
        },
        delos: function () {
            this.del ? this.del(this.contextData) : '';
        },
        ischecked: function (res) {
            this.clickcheckbox ? this.clickcheckbox(this.checkItems) : '';
        }
    },
    components: {
        'treecontent': treecontent
    },
    mounted: function () {
        events.$on('contextData', function (data) {
            this.contextData = data;
        }.bind(this));

        events.$on('changeCurrId', function (id) {
            //改变this.curr.currIndex = active
            this.curr.currIndex = id;
        }.bind(this));

        events.$on('checkClick', function (res) {

            this.ischecked(res);

        }.bind(this));

    }
});

new Vue({
    el: '#demo',

    data: {
        datas: [{
            "id": "5fcb96d94b1f40afa24d5c5494c00243",
            "pid": 0,
            "name": "广新海工",
            "hasChild": true,
            "levels": 0,
            "createBy": 0,
            "createTime": 0,
            "updateBy": "管理员",
            "updateTime": 1483778494000,
            "sortId": 0,
            "sn": 0,
            "children": [
                {
                    "id": "508ee79d1239402286b64acdf927d7da",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "董事会办公室",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "张三",
                    "createTime": 1478600173000,
                    "updateBy": "管理员",
                    "updateTime": 1484745165000,
                    "sortId": 0,
                    "sn": "001",
                    "children": [
                        {
                            "id": "f3d41a6336ed4f789b4ffc61dd1dc1ec",
                            "pid": "508ee79d1239402286b64acdf927d7da",
                            "name": "法务室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745261000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "001001",
                            "children": [
                                {
                                    "id": "cb8ac6aa12fa4167904159667a1e13a9",
                                    "pid": "28ff07b72a254f66b15f9182ef434be5",
                                    "name": "人力开发室",
                                    "hasChild": false,
                                    "levels": 2,
                                    "createBy": "管理员",
                                    "createTime": 1484745204000,
                                    "updateBy": 0,
                                    "updateTime": 0,
                                    "sortId": 0,
                                    "sn": "014001",
                                    "children": 0
                                },
                                {
                                    "id": "a6b8ec3ed2c24c298daa02b0e1ce6476",
                                    "pid": "28ff07b72a254f66b15f9182ef434be5",
                                    "name": "薪酬绩效室",
                                    "hasChild": false,
                                    "levels": 2,
                                    "createBy": "管理员",
                                    "createTime": 1484745222000,
                                    "updateBy": 0,
                                    "updateTime": 0,
                                    "sortId": 0,
                                    "sn": "014002",
                                    "children": 0
                                },
                                {
                                    "id": "3347b47970484a2982a0cce398d4d3a8",
                                    "pid": "28ff07b72a254f66b15f9182ef434be5",
                                    "name": "劳务室",
                                    "hasChild": false,
                                    "levels": 2,
                                    "createBy": "管理员",
                                    "createTime": 1484745231000,
                                    "updateBy": 0,
                                    "updateTime": 0,
                                    "sortId": 0,
                                    "sn": "014003",
                                    "children": 0
                                }
                            ]
                        },

                    ]
                },
                {
                    "id": "45b6d7b7791d465d84d5b7af24cbd9e7",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "企业管理部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "张三",
                    "createTime": 1478600154000,
                    "updateBy": "管理员",
                    "updateTime": 1484744862000,
                    "sortId": 0,
                    "sn": "002",
                    "children": [
                        {
                            "id": "5fcfc2d6675b4a9a9f41d955929badec",
                            "pid": "45b6d7b7791d465d84d5b7af24cbd9e7",
                            "name": "信息技术室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1480661273000,
                            "updateBy": "管理员",
                            "updateTime": 1484744937000,
                            "sortId": 3,
                            "sn": "002001",
                            "children": 0
                        },
                        {
                            "id": "5611a1a83f614e1d96217cee76b704e7",
                            "pid": "45b6d7b7791d465d84d5b7af24cbd9e7",
                            "name": "成本管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1480661282000,
                            "updateBy": "管理员",
                            "updateTime": 1484744925000,
                            "sortId": 1,
                            "sn": "002002",
                            "children": 0
                        },
                        {
                            "id": "8fec256b3b564087ad6ab4cd1c1b3b15",
                            "pid": "45b6d7b7791d465d84d5b7af24cbd9e7",
                            "name": "运营管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484744903000,
                            "updateBy": "管理员",
                            "updateTime": 1484744932000,
                            "sortId": 2,
                            "sn": "002003",
                            "children": 0
                        },
                        {
                            "id": "167177606cd6410c9c24d59004eaae05",
                            "pid": "45b6d7b7791d465d84d5b7af24cbd9e7",
                            "name": "资产管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484744917000,
                            "updateBy": "管理员",
                            "updateTime": 1484744941000,
                            "sortId": 4,
                            "sn": "002004",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "b8ec1b357f3543909349b8c6e227be52",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "资材部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "张三",
                    "createTime": 1478599607000,
                    "updateBy": 0,
                    "updateTime": 1478600652000,
                    "sortId": 0,
                    "sn": "003",
                    "children": [
                        {
                            "id": "fa0dffe16efa44ceaf29d43715c4d793",
                            "pid": "b8ec1b357f3543909349b8c6e227be52",
                            "name": "采购室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "张三",
                            "createTime": 1478600652000,
                            "updateBy": "管理员",
                            "updateTime": 1480661179000,
                            "sortId": 0,
                            "sn": "003001",
                            "children": 0
                        },
                        {
                            "id": "889619b3aa2a41be864cf49100fef0ea",
                            "pid": "b8ec1b357f3543909349b8c6e227be52",
                            "name": "仓储管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1480661191000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "003002",
                            "children": 0
                        },
                        {
                            "id": "56f47b90f2e748258d96c801b2645c0f",
                            "pid": "b8ec1b357f3543909349b8c6e227be52",
                            "name": "资财管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1481026496000,
                            "updateBy": "管理员",
                            "updateTime": 1484745338000,
                            "sortId": 0,
                            "sn": "003003",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "907e351d6ac149e2991e4e14c7f614b8",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "财务部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "张三",
                    "createTime": 1478599970000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "004",
                    "children": [
                        {
                            "id": "157f52c1aa3a438ba859e5cd311a1350",
                            "pid": "907e351d6ac149e2991e4e14c7f614b8",
                            "name": "财务管理室\t",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484465783000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "004001",
                            "children": 0
                        },
                        {
                            "id": "611ac06f3c8b4ae589ee363e5c7d39a0",
                            "pid": "907e351d6ac149e2991e4e14c7f614b8",
                            "name": "资金管理室\t",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484465797000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "004002",
                            "children": 0
                        },
                        {
                            "id": "b4208383df8e4256bfdccbcc08cef623",
                            "pid": "907e351d6ac149e2991e4e14c7f614b8",
                            "name": "成本核算室\t",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484465815000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "004003",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "e028121fbe6e40ac8d7b0010d5b4f9b3",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "设计部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744800000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "005",
                    "children": [
                        {
                            "id": "83743273a3db4ee49f639064c12e95ed",
                            "pid": "e028121fbe6e40ac8d7b0010d5b4f9b3",
                            "name": "设计管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745367000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "005001",
                            "children": 0
                        },
                        {
                            "id": "cc81ca41d71742dea5ea48cf3383db0f",
                            "pid": "e028121fbe6e40ac8d7b0010d5b4f9b3",
                            "name": "技术室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745379000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "005002",
                            "children": 0
                        },
                        {
                            "id": "11eb612c1b9f4e2c84566adae89c5699",
                            "pid": "e028121fbe6e40ac8d7b0010d5b4f9b3",
                            "name": "设计一室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745389000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "005003",
                            "children": 0
                        },
                        {
                            "id": "dbd6c4bd517240c7aeed99758f7ebb04",
                            "pid": "e028121fbe6e40ac8d7b0010d5b4f9b3",
                            "name": "设计二室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745398000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "005004",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "8a2abf4174b646998b8c9da8af6bf91d",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "市场部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744835000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "006",
                    "children": [
                        {
                            "id": "46848c967a24448ebd75adc9ff67b685",
                            "pid": "8a2abf4174b646998b8c9da8af6bf91d",
                            "name": "方案室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745316000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "006001",
                            "children": 0
                        },
                        {
                            "id": "402ed52eda084b2fadcd2b05a5cabe2c",
                            "pid": "8a2abf4174b646998b8c9da8af6bf91d",
                            "name": "营销一室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745290000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "006002",
                            "children": 0
                        },
                        {
                            "id": "bec128d8979b454cb4810cb0ba0b635c",
                            "pid": "8a2abf4174b646998b8c9da8af6bf91d",
                            "name": "营销二室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745302000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "006003",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "77614cdba78242269a301c5a28854ec2",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "质量部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744782000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "007",
                    "children": [
                        {
                            "id": "e2469419fc124bca9b203ec48a899933",
                            "pid": "77614cdba78242269a301c5a28854ec2",
                            "name": "检验室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745435000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "007001",
                            "children": 0
                        },
                        {
                            "id": "ab0cf44a54ac4b4fa77e35a18d0207c5",
                            "pid": "77614cdba78242269a301c5a28854ec2",
                            "name": "试验检测室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745448000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "007002",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "9c42e1dc220a46f59a5d464762160b9f",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "内业车间",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744652000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "008",
                    "children": 0
                },
                {
                    "id": "c13bcc4d16af4ec2bf9c3dac33297966",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "外业车间",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744665000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "009",
                    "children": 0
                },
                {
                    "id": "4464c4328f774063b60f081a7a4c77aa",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "机电车间",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744678000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "010",
                    "children": 0
                },
                {
                    "id": "23813c3bf5354eeaa94c43357f530cf9",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "舾装车间",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744695000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "011",
                    "children": 0
                },
                {
                    "id": "3ed6ae0b24e5434e8e11765f25fa43ec",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "涂装车间",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744719000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "012",
                    "children": 0
                },
                {
                    "id": "f2986180418c4505be34f50fa500cfdf",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "生产管理部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744750000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "013",
                    "children": [
                        {
                            "id": "5904490ce8774fc19b417f5952cd350c",
                            "pid": "f2986180418c4505be34f50fa500cfdf",
                            "name": "计划管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745483000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "013001",
                            "children": 0
                        },
                        {
                            "id": "62842f84ec5142b18337af0309194f3c",
                            "pid": "f2986180418c4505be34f50fa500cfdf",
                            "name": "项目管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745500000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "013002",
                            "children": 0
                        },
                        {
                            "id": "6859fe36404f4d4fbc818470fafb0352",
                            "pid": "f2986180418c4505be34f50fa500cfdf",
                            "name": "调试工程室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745516000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "013003",
                            "children": 0
                        },
                        {
                            "id": "cea09f221d0b4541a6e150cf9a0624e7",
                            "pid": "f2986180418c4505be34f50fa500cfdf",
                            "name": "工艺精度室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745529000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "013004",
                            "children": 0
                        },
                        {
                            "id": "3e095cba92da450398d351188a708c67",
                            "pid": "f2986180418c4505be34f50fa500cfdf",
                            "name": "生产管理室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745544000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "013005",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "28ff07b72a254f66b15f9182ef434be5",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "人力资源部",
                    "hasChild": true,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744845000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "014",
                    "children": [
                        {
                            "id": "cb8ac6aa12fa4167904159667a1e13a9",
                            "pid": "28ff07b72a254f66b15f9182ef434be5",
                            "name": "人力开发室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745204000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "014001",
                            "children": 0
                        },
                        {
                            "id": "a6b8ec3ed2c24c298daa02b0e1ce6476",
                            "pid": "28ff07b72a254f66b15f9182ef434be5",
                            "name": "薪酬绩效室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745222000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "014002",
                            "children": 0
                        },
                        {
                            "id": "3347b47970484a2982a0cce398d4d3a8",
                            "pid": "28ff07b72a254f66b15f9182ef434be5",
                            "name": "劳务室",
                            "hasChild": false,
                            "levels": 2,
                            "createBy": "管理员",
                            "createTime": 1484745231000,
                            "updateBy": 0,
                            "updateTime": 0,
                            "sortId": 0,
                            "sn": "014003",
                            "children": 0
                        }
                    ]
                },
                {
                    "id": "991cc4688795492987cb548320ec905e",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "修船管理部",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744774000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "015",
                    "children": 0
                },
                {
                    "id": "089314dbaa194b62a1a433e901ce40c3",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "安全环保部",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744823000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "016",
                    "children": 0
                },
                {
                    "id": "c32ede55c36941e18d83eb39d711dd32",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "监察审计部",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484745140000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "017",
                    "children": 0
                },
                {
                    "id": "dcc1615404f641899f3abaeddc56aade",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "综合办公室",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484745153000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "018",
                    "children": 0
                },
                {
                    "id": "0a43fd02ddaa4a059d9ffd858cce87a5",
                    "pid": "5fcb96d94b1f40afa24d5c5494c00243",
                    "name": "生产保障车间",
                    "hasChild": false,
                    "levels": 1,
                    "createBy": "管理员",
                    "createTime": 1484744735000,
                    "updateBy": 0,
                    "updateTime": 0,
                    "sortId": 0,
                    "sn": "019",
                    "children": 0
                }
            ]
        }],
        allitems: []
    },
    methods: {
        //span click
        click: function (data) {
            // console.log(node)
            //自定义你喜欢做的
            var odiv = document.getElementById('box');
            odiv.innerHTML = '你点击了 -- >' + data.name;
        },
        //poprver add
        add: function (data) {
            var odiv = document.getElementById('box');
            odiv.innerHTML = data.name;
        },
        //poprver edit
        edit: function (data) {
        },
        //poprver del
        del: function (data) {

        },
        checkedbox: function (selectOptions) {//当前节点,和已经选中了的节点
            // console.log(currNode, selectOptions);
            // console.log(selectOptions)
            this.$set(this.$data, 'allitems', selectOptions.allItems);
        },
    },

    computed: {},

    components: {
        'mytree': mytree,
    }

});