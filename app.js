(
	function(){
		var currentMsgsIndex=0;
		
		/* DOM nodes */
		var $msgsLoader=document.querySelector('.msgs-loading');
		var $msgTemplate=document.querySelector('#templMsg').innerHTML;
		var $msgContainer=document.querySelector('.msgs');
		var $miniLoader=document.querySelector('.miniloader');
		/* data structure for msgs */
		var msgsArr=[];

		/* Debounce timer */
		var debounceTimer;
		var body = document.body,
		    html = document.documentElement;

		var docHeight=Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
		var winHeight= window.innerHeight;


		var miniLoaderShown=false;
		function toggleMiniLoader(){
			if(miniLoaderShown){
				$miniLoader.classList.add('invisible');
			} else {
				$miniLoader.classList.remove('invisible');
			}
			miniLoaderShown=!miniLoaderShown;
		}

		function calcHeight(){
			docHeight=Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
		}

		function fetchNextMessages(){
			if(msgsArr.length>0){
				toggleMiniLoader();
			}
			fetch('http://message-list.appspot.com/messages?pageToken='+currentMsgsIndex++)
			.then(res=>res.json())
			.then(data=>{
			  $msgsLoader.classList.add('hidden');
			  if(msgsArr.length>0){
			  	toggleMiniLoader();
			  }

			  //msgsArr=msgsArr.concat(data.messages);
			  for(var i=0;i<data.count;i++){
			  	var currMsg=data.messages[i];
			  	var $msg=document.createElement("div");
			  	$msg.className="msg";
			  	var msgNode=new MsgNode($msg,$msgTemplate.replace('{%imgsrc%}',currMsg.author.photoUrl).replace('{%name%}',currMsg.author.name).replace('{%timestamp%}',currMsg.updated).replace('{%msg%}',currMsg.content));
			  	$msgContainer.appendChild($msg);
			  	msgsArr.push(msgNode);
			  }
			  calcHeight();
			}).catch(e=>{
				alert("An error has been occoured while fetching msgs");
			});
		}

		function scrollListener(e){
			var winY=window.scrollY;
			if(docHeight-winHeight<winY+100){
				fetchNextMessages();
			}
			var oldHeight=$msgContainer.getBoundingClientRect().height;
			for(var i=0;i<(Math.floor(winY/230)-3);i++){
				msgsArr[i]&&msgsArr[i].clean()
			}
			for(var i=Math.floor(winY/230)-3;i<Math.ceil(winY/130)+8;i++){
				msgsArr[i]&&msgsArr[i].fill();	
			}
			var newHeight=$msgContainer.getBoundingClientRect().height;
			window.scrollTo(0,winY-(oldHeight-newHeight));
			calcHeight();
		}

		function getMsgElem(e){
			var curr=e;
			if(curr.className==="msg"){
				return e;
			}
			else{
				while(curr.className!=="msg"){
					curr=curr.parentNode;
				}
				if(curr.className==="msg"){
					return curr;
				}
			}
			return null;
		}


		function animEndHandler(e){
			e.target.remove();
			calcHeight();
		}

		function addAnimEventListener(element,type,callback){
			var pfx = ["webkit", "moz", "MS", "o", ""];
				for (var p = 0; p < pfx.length; p++) {
					if (!pfx[p]) type = type.toLowerCase();
					element.addEventListener(pfx[p]+type, callback, false);
				}

		}

		document.addEventListener("DOMContentLoaded", function(event) { 
			window.scrollTo(0,0);
			fetchNextMessages();
		});


		document.addEventListener("scroll",function(e){
			if(debounceTimer){
				clearTimeout(debounceTimer)
			}
			debounceTimer=setTimeout(function(){scrollListener(e)},300);
		},false);


		addAnimEventListener($msgContainer,"animationend",animEndHandler);

		/*swipe functionality*/
		var startX=0,endX=0;
		var startY=0,endY=0;
		$msgContainer.addEventListener("touchstart",function(e){
			startX=e.touches[0].clientX;
			startY=e.touches[0].clientY;
		});
		$msgContainer.addEventListener("touchmove",function(e){
			endX=e.touches[0].clientX;
			endY=e.touches[0].clientY;
		});
		$msgContainer.addEventListener("touchend",function(e){
			if(endX-startX>100){
				var currElem=getMsgElem(e.target);
				currElem&&currElem.classList.add("swipeout");
			}
		});
	}
)()



function MsgNode(parent,content){
	this.parentRef=parent;
	this.content=content;
	this.parentRef.innerHTML=content;
	this.isCleaned=false; 
}

MsgNode.prototype.clean=function(){
	if(!this.isCleaned){
		this.parentRef.innerHTML="";
		this.isCleaned=true;
		this.parentRef.classList.add("cleaned");
	}
}

MsgNode.prototype.fill=function(){
	if(this.parentRef){
		this.parentRef.innerHTML=this.content;
		this.isCleaned=false;
		this.parentRef.classList.remove("cleaned");
	}
}





