/*Ajax扩展*/
!function(){


	//默认参数
	var initOptions = {
		//地址
		url:"",
		//方法类型
		method:"GET",
		//是否异步
		async:true,
		//用户名
		user:"",
		//密码
		password:"",
		//头部表
		headers:null,
		//成功返回
		onSuccess:null,
		//返回失败
		onError:null,
		//参数
		vars:null
	};


	//ajax核心方法
	var ajax = function(option)
	{
		//参数设置
		for(var i in initOptions)
			if(option[i] == null)
				option[i] = initOptions[i];

		//ajax定义
		var xmlhttp;
		if (window.XMLHttpRequest)
		{
			//高版本浏览器
			xmlhttp=new XMLHttpRequest();
		}
		else
		{
			//低版本IE
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}

		//状态变化时事件
		xmlhttp.onreadystatechange=function()
		{
			//执行结束
			if(xmlhttp.readyState==4){
				//返回成功
				if(xmlhttp.status==200){
					if(option.onSuccess)
						option.onSuccess(xmlhttp);
				}
				else
				{
					//返回失败
					if(option.onError)
						option.onError(xmlhttp);
				}
			}
		}

		//设置头部
		if(option.headers)
			for(var i in option.headers)
				xmlhttp.setRequestHeader(i,option.headers[i]);

		//参数生成
		var vars = [];
		var sendVar = null;
		if(option.vars)
			for(var i in option.vars)
				vars.push(i+"="+option.vars[i]);

		//POST传值
		if(option.method == "POST")
			sendVar = vars.join("&");

		//GET传值
		if(option.method == "GET")
		{
			if(/\?/.test(option.url))
				option.url += "&" + vars.join("&");
			else
				option.url += "?" + vars.join("&");
		}

		//打开方法
		xmlhttp.open("GET",option.url,option.async);
		//发送
		xmlhttp.send(sendVar);
	}



	//发送GET数据
	ajax.get = function(url,vars,cb,async){
		//参数缺省
		if(typeof vars == "function")
		{
			async = cb;
			cb = vars;
		}

		//使用参数
		var option = {
			url:url,
			vars:vars,
			method:"GET",
			onSuccess:function(res){
				if(cb)
					cb(res.responseText,false,res);
			},
			onError:function(res){
				if(cb)
					cb("",true,res);
			},
			async:async
		}

		ajax(option);
	}

	//发送POST数据
	ajax.post = function(url,vars,cb,async){
		//参数缺省
		if(typeof vars == "function")
		{
			async = cb;
			cb = vars;
		}

		//使用参数
		var option = {
			url:url,
			vars:vars,
			method:"POST",
			onSuccess:function(res){
				if(cb)
					cb(res.responseText,false,res);
			},
			onError:function(res){
				if(cb)
					cb("",true,res);
			},
			async:async
		}

		ajax(option);
	}

	lcg.ajax = ajax;
}();