---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/queueService/"

title: "queueService"
header_sub_title: "Service in module scripts"
doc: "queueService"
docType: "service"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/queue_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/queue_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  queueService



</h1>





Simple service to monitor the number of active requests we have open with SharePoint
Typical use is to display a loading animation of some sort










  

  
## Methods


<h4>
  <code>increase()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/queue_srvc.js#L15'>view</a>


Increase the counter by 1.













<h4>
  <code>reset()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/queue_srvc.js#L27'>view</a>


Decrease the counter by 1.






* Returns: 
  <code>number</code> 








<h4>
  <code>reset()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/queue_srvc.js#L42'>view</a>


Reset counter to 0.






* Returns: 
  <code>number</code> 








<h4>
  <code>registerObserverCallback(callback)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/queue_srvc.js#L57'>view</a>


Register an observer



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        callback
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>











  
  






