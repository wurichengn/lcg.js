# lcg.js
一个组件化的前端JS开发框架

# 这个框架是什么
lcg.js本身仅仅是一套组件关系构造的框架，有着和MVC不同却同样遵循逻辑视图分离以及结构化的开发体系。这套体系本身不具备多少附属功能，但是可以提供一个高效的组件开发模式。核心的体系旨在将功能分离开发并

#基本用法
##绑定组件
lcg.js框架的一切都从组件开始，它就好像是面向对象语言中的类一样，定义着各种功能并最终给予生成的对象。不过它并不直接创建一个对象，而是将这些功能绑定在一个所谓的代理上。

```javascript
lcg.bind("hello",{
  //创建代理
  proxy:function(vals){
    return document.body;
  },
  //组件初始化时执行
  init:function(vals){
    this.setName("Hello Word!");
  },
  //自定义方法
  setName:function(){
    this.innerHTML = "Hello Word!";
  }
});
```

如果我们只是将上面的代码放入HTML中什么都不会发生，因为那仅仅是定义，下面我们来使用这个组件

```javascript
lcg.create("hello");
```

加入上面的代码后`body`里的内容就变成了`Hello World!`

##执行的过程
在上面的代码中我们绑定了一个`hello`组件，这里我们定义了一个关于该组件的内容。其中`proxy`方法用于获取要绑定方法的代理对象，这里我们直接绑定到`body`上。除了`proxy`方法外的所有方法都会被`附着`到代理对象上(这里是`body`)，在所有方法里的`this`也是指的这个代理对象本身，所以我们可以直接通过`this`来操作这个代理对象。在上面的例子中，我们在组件外部同样可以通过`body.setName`来访问。

##举个栗子
上面的代码直接使用了`body`，这回我们加入一些参数。

```html
<div id="p1"></div>
<div id="p2"></div>
```

```javascript
lcg.bind("people",{
    proxy:function(vals){
        return document.querySelector(vals.query);
    },
    init:function(vals){
        this.innerHTML = "我是"+vals.name+","+vals.age+"岁";
    }
});

lcg.create("people",{query:"#p1",name:"老城哥",age:22});
lcg.create("people",{query:"#p2",name:"吴日城",age:21});
```

执行结果如下：
```
我是老城哥,22岁
我是吴日城,21岁
```

上面的代码中我们通过参数中的`query`来获取Dom对象作为代理，并在这个代理上执行了`init`方法。通过参数中的`name`和`age`来改变Dom节点的内容。

能接收初始化参数的方法只有`proxy`和`init`，如果其他方法也需要这些参数，请进行传参或使用`this`进行存储。

对象和组件之间可以任意数量的`附着`，不过并不推荐一个对象绑定多次同一个组件，除非开发的是一个一次性功能型组件。

##不仅仅局限于Dom
由于在HTML开发中绝大多数时候都在与Dom节点打交道，但是lcg.js是一个以js对象为目标的框架，所以请放心的用在任意JS对象上。

```javascript
lcg.bind("mydate",{
    //以一个新的Date对象作为组件目标
    proxy:function(){
        return new Date();
    },
    //格式化时间
    format:function(){
        return 1900+(this.getYear())+"年"+(1+this.getMonth())
            +"月"+this.getDate()+"日";
    }
});
alert(lcg.create("mydate").format());
```

上面的组件使用当前时间作为代理，为这个新建的时间对象插入了一个格式化时间的方法，通过调用这个方法来获取格式化后的时间。这样做不同于直接为`Date.prototype`中加入`format`方法，这样做不会影响所有的`Date`对象，仅仅会应用于通过`lcg.js`代理的对象。

##为已存在的对象绑定组件

如果一个对象已经被创建，可以直接通过`lcg.use`来使用组件而不需要调用`proxy`方法获取对象。

```javascript
lcg.bind("hand",{
    init:function(){
        console.log("I have a hand");
    }
});
lcg.bind("foot",{
    init:function(){
        console.log("I have a foot");
    }
});
var people = lcg.use(lcg.use({},"hand"),"foot");
```
执行结果如下
```
I have a hand
I have a foot
```

上面我们通过`lcg.use`方法为一个空对象连续附着了`hand`组件和`foot`组件，这样这个人类就拥有了这两个组件的功能。

这里`init`是一个比较特殊的方法，在每个组件被附着的时候都会被框架主动调用一次，那么其他方法在两个组件出现命名冲突的时候应该如何处理呢？

##组件命名冲突

```javascript
lcg.bind("foot-left",{
    jump:function(){
        console.log("left jump");
    }
});
lcg.bind("foot-right",{
    jump:function(){
        console.log("right jump");
    }
});
var people = lcg.use({},"foot-left");
lcg.use(people,"foot-right");
people.jump();
```
执行结果如下
```
left jump
```
在主键`附着`对象的时候，如果遇到原生的命名冲突方法将会将其覆盖，如果遇到其他组件附着过的时候就不会覆盖，而是隐藏起来。如果希望右脚跳跃的话可以使用下面的方法进行编写。

```javascript
people.jump.use("foot-right")();
```
执行结果
```
right jump
```

上面我们在使用被组件附着的方法前先对方法使用了`use`方法，强制规定了使用哪一个组件的方法，第二个括号中则填写这个方法所需要的参数即可，我们的`jump`方法留空即可。这样我们就可以通过组件名来使用对象相应组件的方法。


##消息触发
上面我们给出了可以调用指定组件指定方法的用法，那如果我们希望所有组件的指定名称方法都被调用呢？
```javascript
people.jump.message();
```
执行结果
```
left jump
right jump
```
上面我们通过在调用方法前加入一个message就可以进行消息触发，它将按照组件`附着`的顺序来执行相应的方法。值得注意的是消息触发是没有返回值的，主要用于通用事件的触发。如果说希望通过函数获取返回的话请通过对象参数作为`钩子`获取。

##组件继承

虽然组件和对象之间可以任意的通过`附着`来组合，但是也会遇到需要扩展一个已存在组件功能的情况，这个时候可以使用继承体系。

```javascript
lcg.bind("life",{
    proxy:function(vals){
        return {name:vals};
    },
    die:function(){
        console.log("life die");
    }
});
lcg.bind("people",{
    //继承自life
    extend:"life",
    //重构die方法
    die:function(){
        console.log(this.name+" die");
        this._parent("die");
    }
});
lcg.create("people","史莱姆").die();
```
执行结果
```
史莱姆 die
life die
```

我们通过`extend`属性来让组件继承自另一个组件，继承的过程中会拥有父组件中的所有方法，包括`proxy`。如果子组件与父组件拥有命名冲突方法的话子组件会覆盖父组件的方法（重构）。但是在子组件的方法中（除了`proxy`）可以直接通过`this._parent(funcName,args,...)`来调用父组件中相应的方法（调用父组件方法的功能还存在部分问题，如无法在延时方法中执行）。

组件是可以无限的继承下去，并且与其他组件共同绑定的时候不会有冲突问题。但是我们无法通过`func.use(moduleName)()`来执行一个父组件的方法，`message`也是一样，他们都仅限于直接附着于对象的组件方法。

##说明

看完说明希望您已经了解如何使用`lcg.js`框架设计属于您自己的组件，并且希望您可以享受于组件化的开发流程中。在`lcg.build.js`框架中还封装了一些其他的功能和一些预制组件(包括`ajax`、`dom-module`等)，如果您仅仅需要这套组件体系的话引入`lcg.js`即可。

#dom-module组件扩展

`dom-module`是一个基于`lcg.js`的扩展，如果你想要开发Dom相关的组件这个扩展也许适合你。

注：从这之后的例子中请保证引入的是`lcg.build.js`而非`lcg.js`

```html
<div dom-module="people">我是{{name}},{{age}}岁</div>
```

```javascript
lcg.bind("people",{
    //继承自dom-module
    extend:"dom-module",
    init:function(vals){
        //属性传递
        this.name = vals.name;
        this.age = vals.age;
        //执行dom-module的初始化
        this._parent("init");
    }
});
```
上面我们在HTML中使用`dom-module`属性将一个Dom绑定为`people`组件的视图，并且在js中创建了`people`组件继承自`dom-module`。不过此时我们打开网页什么都不会显示，因为我们开发的是组件，这样做我们仅仅是定义好了它。

```html
<div dom-prefab="people" values="{name:'老城哥',age:22}"></div>
<dom-prefab type="people" values="{name:'老城哥',age:22}"></dom-prefab>
```
上面两种写法都可以使用组件，不过第一种写法可以兼容到`IE8`，而第二种只能兼容到`IE9`，因为`IE8`不支持自定义标签。我们会发现只要定义好组件后，不管把上面的代码放到任何位置都可以在那创建这个组件。其中`values`是组件的参数，可以是`json`或者`js变量`又或者是`string`。

在我们组件的Dom视图中有一些被双花括号包起来的内容，这些内容将会把组件所对应的成员映射到Dom相应的位置，目前只支持标签的`文本域`和`属性值`。

在组件的初始化方法`init`中我们调用了`_parent`方法来使用父组件中的`init`方法。这是因为在`dom-module`组件中本身就有`init`方法，所以在该方法重构后请视情况决定是否要执行`dom-module`的`init`方法，其中组件包含的方法有：

```javascript
//执行所有初始化
init();
//初始化内部包含的预制节点
initFab();
//初始化内部的dom-list列表
initLists();
//初始化内部节点的lid映射关系
initIDS();
//将组件的代理以moduleRoot以及$root成员赋值给所有子节点
initModuleRoot();
//初始化内容映射钩子
initDomVal();
```

如果在组件包含上面的同名方法时请注意。如果有部分功能不希望使用的话可以不通过`this._parent("init");`来初始化功能，而是在`init`方法中分别调用希望初始化的功能，如：

```javascript
init:function(){
    this.initIDS();
    this.initDomVal();
}
```

继承自`dom-module`组件的组件将不会执行`proxy`方法，而是直接通过绑定的Dom视图来动态生成，所以在组件中的`this`所指向的对象就是这个动态生成的Dom视图。

当然，我们一样可以通过js来动态创建`dom-module`组件

```javascript
lcg.on("ready",function(){
    document.body.appendChild(lcg.create("people",{name:"老城哥",age:22}));
});
```

上面的代码可以让我们在`body`中动态添加一个组件，由于`dom-module`组件的视图在文档载入完成后才开始处理，所以我们在绑定组件后是不能马上使用的，请使用`ready`事件确保文档载入完成并且lcg.js完成了处理。

##lid快速访问

有的时候我们希望直接访问一个子节点，但是却不希望每次都通过`querySelector`来访问，在组件中我们可以通过加入`lid`属性来快速访问。

```html
<div dom-module="form">
    <input lid="first-name" />
    <input lid="last-name" />
    <button onclick="$root.talkName()">talk</button>
</div>
<div dom-prefab="form"></div>
```

```javascript
lcg.bind("form",{
    extend:"dom-module",
    talkName:function(){
        alert(this.ids["first-name"].value +
            this.ids["last-name"].value);
    }
});
```

上面的代码中我们为两个`input`分别加入了`lid`属性，然后通过`this.ids[lidName]`来快速访问这个子节点，组合姓和名。我们在`button`的`onclick`中写入了`$root.talkName()`来调用组件的方法，这是由于`button`并非根节点，所以无法直接调用，子节点可以通过`moduleRoot`或者`$root`来访问根节点。

##dom-list组件表

如果你需要将一个组件的Dom节点作为另一个组件的容器，内部放置由数个组件组成的列表，那么你可能会需要用到`dom-list`

```html
<!-- 学校视图 -->
<div dom-module="school">
    <div>This is {{name}}</div>
    <div dom-list="list:student"></div>
</div>
<!-- 学生视图 -->
<div dom-module="student">My name is {{name}}</div>
```

```javascript
//学校组件
lcg.bind("school",{
    extend:"dom-module",
    init:function(vals){
        //在父组件初始化前创建list对象
        this.list = [];
        this.name = vals;
        this._parent("init");
    },
    addStudent:function(name){
        this.list.push(name);
    },
    removeStudent:function(offset,length){
        this.list.splice(offset,length);
    }
});
//学生组件
lcg.bind("student",{
    extend:"dom-module",
    init:function(vals){
        this.name = vals;
        this._parent("init");
    }
});
lcg.on("ready",function(){
    var school = lcg.create("school","衡水中学");
    school.addStudent("苛政");
    school.addStudent("王雪");
    document.body.appendChild(school);

    var school = lcg.create("school","东莞理工大学");
    school.addStudent("老城哥");
    school.addStudent("打酱油");
    school.addStudent("吴日城");
    school.removeStudent(1,1);
    document.body.appendChild(school);
});
```
上面代码的执行结果:
```
This is 衡水中学
My name is 苛政
My name is 王雪
This is 东莞理工大学
My name is 老城哥
My name is 吴日城
```

上面的代码中我们在`school`的视图中的`div`加入了`dom-list`属性，属性内容为`arrName:moduleName`，`:`前面为需要作为映射使用的数组，后面为所使用的组件名。然后我们在`school`组件的定义中先创建了一个`list`作为列表的容器（请在`this._parent("init")`前定义好数组）。之后我们在数组中进行`push`或者`splice`操作时就会在相应的Dom容器中进行相应的操作，数组中的数据会作为组件的初始化参数传入。在上面的代码中我们分别添加了数个学生，再通过`splice`删除了一个学生。

容器组件和内容组件之间往往需要互相进行交互处理，实际上他们也是可以互相访问的。

```html
<!-- 学校视图 -->
<div dom-module="school">
    <div>This is {{name}} - Best Student:{{stuName}}</div>
    <div dom-list="list:student"></div>
</div>
<!-- 学生视图 -->
<div dom-module="student">My name is {{name}}</div>
```

```javascript
//学校组件
lcg.bind("school",{
    extend:"dom-module",
    init:function(vals){
        //在父组件初始化前创建list对象
        this.list = [];
        this.name = vals;
        this.stuName = "";
        this._parent("init");
    },
    addStudent:function(name){
        this.list.push(name);
    },
    removeStudent:function(offset,length){
        this.list.splice(offset,length);
    },
    disableStudent:function(offset){
        this.list.fabList[offset].style["color"] = "#999";
    }
});
//学生组件
lcg.bind("student",{
    extend:"dom-module",
    init:function(vals){
        this.name = vals;
        this._parent("init");
        this.onclick = this.best;
    },
    best:function(){
        this._fabList.module.stuName = this.name;
    }
});
lcg.on("ready",function(){
    var school = lcg.create("school","衡水中学");
    school.addStudent("苛政");
    school.addStudent("王雪");
    document.body.appendChild(school);

    var school = lcg.create("school","东莞理工大学");
    school.addStudent("老城哥");
    school.addStudent("吴日城");
    school.disableStudent(1);
    document.body.appendChild(school);
});
```

这回我们通过`disableStudent`方法将学生`吴日城`禁用，他会变成灰色，在任何一个学生被点击后会被学校提名。

这里我们通过`list.fabList`来访问保存组件的映射表，再通过相应的下标就可以访问内容组件。而被`dom-list`创建的组件可以通过`_fabList`方法来访问自己所属的容器列表，再通过`module`可以访问这个容器列表所属的组件。

`dom-list`还附带了一个`del`方法用于通过组件对象删除子组件。

```javascript
//学生组件
lcg.bind("student",{
    extend:"dom-module",
    init:function(vals){
        this.name = vals;
        this._parent("init");
        this.onclick = this.del;
    },
    del:function(){
        this._fabList.del(this);
    }
});
```

上面的代码把`onclick`事件转移到`del`上面，此时调用所属容器列表的的`del`事件删除自己，这样不需要知道自己的下标。

##dom-module和其他组件混合使用

`dom-module`组件可以和其他任何组件一起使用，但是并不推荐两个同样继承自`dom-module`的组件同时附着在一起。

```html
<div dom-module="test">{{text}}</div>
<div dom-prefab="test" values="{text:'测试'}"></div>
```

```javascript
lcg.bind("test",{
    extend:"dom-module",
    init:function(vals){
        this._parent("init");
        this.text = vals.text;
        //加入easy-css组件功能
        lcg.use(this,"easy-css");
        this.css({color:"#999","font-size":"40px"});
    }
});
lcg.bind("easy-css",{
    css:function(vals){
        for(var i in vals)
            this.style[i] = vals[i];
    }
});
```

在上面的代码中我们为`test`组件加入了`easy-css`组件的功能并使用了`css`方法来改变样式。

##dom-loader载入外部HTML文件
由于组件的开发和设计往往需要HTML和JS共同开发，所以我们可以将一个组件的代码(HTML、JS、CSS)写成一个HTML文件，再放入到一个路径中作为组件并通过`dom-loader`来动态载入。

```html
<div dom-loader="tree.html"></div>
```

上面的代码可以让文档载入完成的时候将`tree.html`完全载入到页面中并替换这个`div`。其中的HTML将直接插入，`script`标签则会被剔除并直接执行。整个过程由`ajax`来支持，所以必须要在服务器下运行才有效。载入过程是同步的，载入完成之前会阻塞JS的执行，所以不会在载入完成前就进行后续的操作。

如果组件无需后台动态生成，可以将组件路径在后台加入`Cache`来使得整个组件都只需要本地缓存即可访问，可以极大的降低访问量。

##sdom-module组件

在`dom-module`扩展里有另一个和`dom-module`组件几乎功能完全一样的组件`sdom-module`。它们唯一的区别在于`sdom-module`组件在创建时生成的并非普通的Dom节点，而是一个`shadowDom`影子节点，这个节点包含了组件视图中的Dom，由于`shadowDom`还没有被广泛兼容，有兴趣的朋友可以关注一下相关的知识。

#lcg.js插件开发

`lcg.js`是一个扩展性极强的框架，不仅仅能用它开发组件，框架本身还开放了插件接口。用于让开发者从切面管理组件。

##基本事件

```javascript
//文档及插件载入完成
lcg.on("ready");
//文档载入完成，在ready前执行
lcg.on("plugin-ready");
//绑定组件事件
lcg.on("bind");
//创建组件事件
lcg.on("create");
//应用组件事件
lcg.on("use");
```

通过这些事件，可以帧听在组件绑定或者组件初始化前对组件进行处理，使得一些功能或者操作直接面向于一类或者全部组件。

##基本方法

```javascript
//判断内容是否是指定组件的子孙组件
lcg.extendForm(vals,parentName);
```

基本方法目前仅提供了继承的判断，区分继承自不同组件的定义。

#结语

框架中还附带了一些其他的扩展，包括`ajax`、`style`处理器等其他功能，可以在代码中查阅相关内容。

本框架为个人开发框架，所以可能还存在部分问题。