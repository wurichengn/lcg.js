//======DOM组件系统======
!function(){
    //Dom组件核心
    var dm = {};
    lcg.domModule = dm;

    //绑定组件
    //Dom组件
    lcg.bind("dom-module",{
        //初始化
        init:function(){
            this.initFab();
            this.initLists();
            this.initIDS();
            this.initModuleRoot();
            this.initDomVal();
        },
        //初始化数组侦听
        initLists:function(){
            initLists(this);
        },
        //初始化编号获取
        initIDS:function(){
            initIDS(this);
        },
        //初始化子节点的ModuleRoot
        initModuleRoot:function(){
            initModuleRoot(this);
        },
        //初始化数据绑定
        initDomVal:function(){
            initDomVal(this);
        },
        //初始化预制
        initFab:function(){
            initFab(this);
        }
    });
    //影子Dom组件
    lcg.bind("sdom-module",{
        extend:"dom-module",
        //宿主
        host:function(vals,dom){
            var re = document.createElement("div");
            if(dom)
                for(var i = dom.childNodes.length - 1;i >= 0;i--)
                    re.appendChild(dom.childNodes[i]);
            return re;
        }
    });


    //组件表
    var modules = {};
    var prefabs = {};

    //帧听绑定事件
    lcg.on("bind",function(e){
        //如果继承自DOM组件
        if(lcg.extendForm(e.vals,"dom-module"))
            modules[e.name] = e.vals;
        if(lcg.extendForm(e.vals,"sdom-module"))
            e.vals._isShadowDom = true;
    });

    //创建事件
    lcg.on("create",function(e){
        if(lcg.extendForm(lcg.getModule(e.name),"dom-module") || lcg.extendForm(e.name,"sdom-module"))
        {
            e.stop();
            return dm.init(e.name,null,e.vals);
        }
    });

    //组件祖先是否为dom-module
    lcg.extendForm = function(vals,name){
        if(vals.extend == null)
            return false;
        if(vals.extend == name)
            return true;
        return lcg.extendForm(lcg.getModule(vals.extend),name);
    }

    //预制关键字属性
    var keyssFab = {
        "type":true,
        "values":true,
        "dom-prefab":true
    };
    //文档载入事件
    lcg.on("ready",function(){
        //保存组件相应的HTML
        for(var i in modules){
            var dom = document.querySelector("*[dom-module='"+i+"']");
            prefabs[i] = dom.outerHTML;
            dom.parentNode.removeChild(dom);
        }
        //初始化所有预制
        initFab(document);
    });

    //初始化预制
    var initFab = function(dom){
        //创建相应的预制
        var fabs = dom.querySelectorAll("dom-prefab,*[dom-prefab]");
        for(var i = 0;i < fabs.length;i++)
        {
            //从属性中获取预制
            var vals = {};
            if(fabs[i].getAttribute("values"))
                vals = eval("("+fabs[i].getAttribute("values")+")");
            //初始化组件
            dm.init(fabs[i].getAttribute("dom-prefab") || fabs[i].getAttribute("type"),fabs[i],vals);
        }
    }


    //转移属性
    var moveAttribute = function(from,to){
        //从属性获取初值
        for(var j = 0;j < from.attributes.length;j++)
        {
            var atts = from.attributes[j];
            if(keyssFab[atts.name] != true)
                to.setAttribute(atts.name,atts.value);
        }
    }


    //创建初始化一个组件
    dm.init = function(name,dom,vals,noInit){
        if(modules[name]._isShadowDom)
        {
            //shadowDom结构
            var div = modules[name].host;
            if(typeof modules[name].host == "function")
                div = modules[name].host(vals,dom);
            moveAttribute(dom,div);
            var sd = div.createShadowRoot();
            sd.innerHTML = prefabs[name];
            if(dom && dom.parentNode)
            {
                dom.parentNode.insertBefore(div,dom);
                dom.parentNode.removeChild(dom);
            }
            dom = sd;
        }
        else
        {
            //普通Dom结构
            if(dom == null)
                dom = document.createElement("div");
            dom.innerHTML = prefabs[name];
            var domz = dom.querySelector("*");
            moveAttribute(dom,domz);
            if(dom.parentNode)
            {
                dom.parentNode.insertBefore(dom.querySelector("*"),dom);
                dom.parentNode.removeChild(dom);
            }
            dom = domz;
        }

        //构造LCG组件并阻止初始化
        var re = lcg.render(modules[name],dom,vals,true);
        //保存宿主
        if(modules[name]._isShadowDom)
            re.host = div;

        //执行初始化
        if(!noInit && re.init)
            re.init(vals);
        //触发初始化事件
        lcg.trigger("dom-module-init",{name:name,dom:dom,vals:vals});
        return re;
    }

    //初始化ID表
    var initIDS = function(dom){
        var ids = {};
        var idoms = dom.querySelectorAll("*[lid]");
        for(var i = 0;i < idoms.length;i++)
        {
            var attr = idoms[i].getAttribute("lid");
            if(ids[attr] == null)
                ids[attr] = idoms[i];
        }
        dom.ids = ids;
    }


    //======组件列表======
    //初始化所有组件列表
    var initLists = function(dom){
        var lists = dom.querySelectorAll("*[dom-list]");
        for(var i = 0;i < lists.length;i++)
            initList(lists[i],dom);
        if(dom.getAttribute && dom.getAttribute("dom-list") != null)
            initList(dom,dom);
    }

    //初始化组件列表
    var initList = function(dom,root){
        var vals = dom.getAttribute("dom-list");
        var kv = vals.split(":");
        var domList = [];
        //获取数组
        var arr = root[kv[0]];
        if(arr == null)
            return;
        arr.fabList = domList;
        arr.module = root;
        //删除方法
        arr.del = function(module){
            for(var i in domList)
            {
                if(module._isShadowDom)
                {
                    if(domList[i] == module.host)
                        arr.splice(Number(i),1);
                }
                else
                    if(domList[i] == module)
                        arr.splice(Number(i),1);
            }
        }
        //生成一个fab
        var create = function(datas){
            //创建并阻止初始化
            var fab = dm.init(kv[1],null,datas,true);
            fab._fabList = arr;
            if(fab.init)
                fab.init(datas);
            //影子节点特殊处理
            if(fab._isShadowDom)
                return fab.host;
            return fab;
        }
        //初始化数组原有内容
        for(var i = 0;i < arr.length;i++){
            arr[i]._id = i;
            var fab = create(arr[i]);
            dom.appendChild(fab);
            domList.push(fab);
        }
        //绑定数组方法
        lcg.hook.bindArray(arr,
            //插入数据
            function(datas,start){
                //加入非插入
                if(start == null || start == 0)
                    for(var i in datas){
                        //传递下标初始化组件
                        datas[i]._id = domList.length;
                        var fab = create(datas[i]);
                        dom.appendChild(fab);
                        domList.push(fab);
                    }
                else
                {
                    //插入
                    var startDom = domList[start];
                    for(var i in datas){
                        //传递下标初始化组件
                        datas[i]._id = start+i;
                        var fab = create(datas[i]);
                        //插入相应内容
                        dom.insertBefore(fab,startDom);
                        domList.splice(start+i,0,fab);
                    }
                }
            },
            //删除数据
            function(start,len){
                for(var i = 0;i < len;i++)
                    dom.removeChild(domList[start + i]);
                domList.splice(start,len);
            });
    }



    //======moduleRoot传递======
    var initModuleRoot = function(dom){
        var dlist = dom.querySelectorAll("*");
        for(var i = 0;i < dlist.length;i++)
            if(dlist[i].$root == null)
                dlist[i].moduleRoot = dlist[i].$root = dom;
    }



    //======对象绑定======
    var initDomVal = function(dom,root){
        root = root || dom;
        //如果是shadowDom
        if(dom.nodeName == "#document-fragment")
        {
            //判断子节点
            for(var i = 0;i < dom.childNodes.length;i++)
                initDomVal(dom.childNodes[i],root)
            return;
        }
        //如果是文本
        if(dom.nodeName == "#text"){
            var re = dom.data.match(/{{.*?}}/);
            if(re && re.length > 0)
                listenerText(dom,root);
            return;
        }
        //判断是否需要绑定
        var re = dom.outerHTML.match(/{{.*?}}/);
        if(re && re.length > 0)
        {
            //判断子节点
            for(var i = 0;i < dom.childNodes.length;i++)
                initDomVal(dom.childNodes[i],root)
        }
        //判断属性是否绑定
        for(var i = 0;i < dom.attributes.length;i++){
            var atts = dom.attributes[i];
            var re = atts.value.match(/{{.*?}}/);
            if(re && re.length > 0)
                listenerAttr(atts,root);
        }
    }

    //侦听文本变化
    var listenerText = function(dom,root){
        var jxList = dom.data.match(/{{.*?}}|[\s\S]/g);
        for(var i in jxList)
            if(jxList[i].length > 3)
                listenerOnce(jxList[i],root,function(val,i){
                    jxList[i] = val;
                    dom.data = jxList.join("");
                },i);
    }

    //侦听属性变化
    var listenerAttr = function(atts,root){
        var jxList = atts.value.match(/{{.*?}}|[\s\S]/g);
        for(var i in jxList)
            if(jxList[i].length > 3)
                listenerOnce(jxList[i],root,function(val,i){
                    jxList[i] = val;
                    atts.value = jxList.join("");
                },i);
    }

    //侦听一次变化
    var listenerOnce = function(str,root,cb,data){
        root.__bindKeyList = root.__bindKeyList || {};
        var key = str.match(/{{(.*?)}}/)[1];
        //初始化绑定列表
        if(root.__bindKeyList[key] == null)
            root.__bindKeyList[key] = [];
        var list = root.__bindKeyList[key];
        //加入回调
        cb._data = data;
        list.push(cb);
        cb(root[key],data);
        //如果没有绑定过
        if(!list._isbind)
        {
            list._isbind = true;
            //绑定变化
            lcg.hook.bindKeySet(root,key,function(val){
                for(var i=0;i < list.length;i++)
                    list[i](val,list[i]._data);
            });
        }
    }
    
}();



//======预载入HTML======
!function(){
    //插件载入事件
    lcg.on("plugin-ready",function(){
        var loaders = document.querySelectorAll("loader,*[dom-loader]");
        for(var i = 0;i < loaders.length;i++)
        {
            var src = loaders[i].getAttribute("src") || loaders[i].getAttribute("dom-loader");
            loadOne(loaders[i],src);
        }
    });


    //属性字符串转属性
    var str2Attr = function(dom,str){
        var kvs = str.match(/[a-zA-Z0-9\-]*=".*?"/g);
        for(var i = 0;i < kvs.length;i++)
        {
            var kv = kvs[i].match(/([a-zA-Z0-9\-]*)="(.*?)"/);
            dom.setAttribute(kv[1],kv[2]);
        }
    }


    //载入一个节点
    var loadOne = function(dom,src){
        lcg.ajax.get(src,function(res){
            var scripts = res.match(/<script.*?>[\s\S]*?<\/script>/g);
            var styles = res.match(/<style.*?>[\s\S]*?<\/style>/g);
            res = res.replace(/<script.*?>[\s\S]*?<\/script>|<style.*?>[\s\S]*?<\/style>/g,"");
            dom.innerHTML = res;
            for(var i = dom.childNodes.length - 1;i >= 0;i--)
                dom.parentNode.insertBefore(dom.childNodes[i],dom);
            //执行脚本
            if(scripts)
                for(var i = 0;i < scripts.length;i++)
                    eval(scripts[i].match(/<script.*?>([\s\S]*?)<\/script>/)[1]);
            //加入样式
            if(styles)
                for(var i = 0;i < styles.length;i++)
                {
                    var style = document.createElement("style");
                    lcg.style.setStyleText(style,styles[i].match(/<style.*?>([\s\S]*?)<\/style>/)[1]);
                    str2Attr(style,styles[i].match(/<style(.*?)>[\s\S]*?<\/style>/)[1]);
                    dom.parentNode.insertBefore(style,dom);
                }
            //删除载入的标记节点
            dom.parentNode.removeChild(dom);
        },false);
    }
}();