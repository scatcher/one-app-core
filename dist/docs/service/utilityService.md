---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/utilityService/"

title: "utilityService"
header_sub_title: "Service in module scripts"
doc: "utilityService"
docType: "service"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/utility_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/utility_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  utilityService



</h1>





Provides shared utility functionality across the application.










  

  
## Methods


<h4>
  <code>xmlToJson(rows, options.mapping, options.includeAllAttrs, options.removeOws)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/utility_srvc.js#L20'>view</a>


This function converts an XML node set to JSON
Modified version of SPServices "SPXmlToJson" function



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
        rows
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        <p>[&quot;z:rows&quot;]</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.mapping
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        <p>[columnName: mappedName: &quot;mappedName&quot;, objectType: &quot;objectType&quot;]</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.includeAllAttrs
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        <p>[If true, return all attributes, regardless whether they are in the mapping]</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.removeOws
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        <p>[Specifically for GetListItems, if true, the leading ows_ will be stripped off the field name]</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Array</code> 








<h4>
  <code>attrToJson(value, objectType)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/utility_srvc.js#L73'>view</a>


Converts a SharePoint string representation of a field into the correctly formatted JS version



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
        value
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        objectType
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>*</code> 








<h4>
  <code>yyyymmdd()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/utility_srvc.js#L283'>view</a>


Convert date into a int formatted as yyyymmdd
We don't need the time portion of comparison so an int makes this easier to evaluate













<h4>
  <code>dateWithinRange(startDate, endDate, dateToCheck)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/utility_srvc.js#L298'>view</a>


Converts dates into yyyymmdd formatted ints and evaluates to determine if the dateToCheck
falls within the date range provided



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
        startDate
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        endDate
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        dateToCheck
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        <p>defaults to the current date</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>boolean</code> 






  
  






