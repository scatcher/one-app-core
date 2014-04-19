---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/fieldService/"

title: "fieldService"
header_sub_title: "Service in module scripts"
doc: "fieldService"
docType: "service"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/field_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  fieldService



</h1>





Handles the mapping of the various types of fields used within a SharePoint list










  

  
## Methods

<div id="resolveValueForEffectivePermMask"></div>
<h2>
  <code>resolveValueForEffectivePermMask(perMask)</code>

</h2>

Takes the name of a permission mask and returns a permission value which can then be used
to generate a permission object using modelService.resolvePermissions(outputfromthis)



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
        perMask
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>string</code> value




<div id="mockPermMask"></div>
<h2>
  <code>mockPermMask(options, options.permissionLevel)</code>

</h2>

Defaults to a full mask but allows simulation of each of main permission levels



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
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.permissionLevel
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>string</code> 




<div id="Field"></div>
<h2>
  <code>Field(obj)</code>

</h2>

Decorates field with optional defaults



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
        obj
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Field</code> 




<div id="getDefaultValueForType"></div>
<h2>
  <code>getDefaultValueForType(fieldType)</code>

</h2>

Returns the empty value expected for a field type



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
        fieldType
        
        
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




<div id="getMockData"></div>
<h2>
  <code>getMockData(fieldType, options, options.staticValue)</code>

</h2>

Can return mock data appropriate for the field type, by default it dynamically generates data but
the staticValue param will instead return a hard coded type specific value



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
        fieldType
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.staticValue
        
        
      </td>
      <td>
        
  <code>boolean</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>*</code> mockData




<div id="defaultFields"></div>
<h2>
  <code>defaultFields()</code>

</h2>

Read only fields that should be included in all lists









<div id="extendFieldDefinitions"></div>
<h2>
  <code>extendFieldDefinitions(list, list.customFields, list.fields, list.viewFields)</code>

</h2>

1. Populates the fields array which uses the Field constructor to combine the default
SharePoint fields with those defined in the list definition on the model
2. Creates the list.viewFields XML string that defines the fields to be requested on a query



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
        list
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        list.customFields
        
        
      </td>
      <td>
        
  <code>array</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        list.fields
        
        
      </td>
      <td>
        
  <code>array</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        list.viewFields
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>








  
  






