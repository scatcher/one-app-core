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

##[fieldService]()

Handles the mapping of the various types of fields used within a SharePoint list


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





<h3 class="api-title">

  fieldService



</h3>





Handles the mapping of the various types of fields used within a SharePoint list










  

  
## Methods


<h4>
  <code>resolveValueForEffectivePermMask(perMask, perMask)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L43'>view</a>


Takes the name of a permission mask and returns a permission value which can then be used
to generate a permission object using modelService.resolvePermissions(outputfromthis)


###Params

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



###Example





<h4>
  <code>mockPermMask(options, options.permissionLevel, options, options.permissionLevel)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L78'>view</a>


Defaults to a full mask but allows simulation of each of main permission levels


###Params

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



###Example





<h4>
  <code>Field(obj, obj)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L125'>view</a>


Decorates field with optional defaults


###Params

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



###Example





<h4>
  <code>getDefaultValueForType(fieldType, fieldType)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L191'>view</a>


Returns the empty value expected for a field type


###Params

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



###Example





<h4>
  <code>getMockData(fieldType, options, options.staticValue, fieldType, options, options.staticValue)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L207'>view</a>


Can return mock data appropriate for the field type, by default it dynamically generates data but
the staticValue param will instead return a hard coded type specific value


###Params

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



###Example





<h4>
  <code>defaultFields()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L228'>view</a>


Read only fields that should be included in all lists








###Example





<h4>
  <code>extendFieldDefinitions(list, list.customFields, list.fields, list.viewFields, list, list.customFields, list.fields, list.viewFields)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/field_srvc.js#L245'>view</a>


1. Populates the fields array which uses the Field constructor to combine the default
SharePoint fields with those defined in the list definition on the model
2. Creates the list.viewFields XML string that defines the fields to be requested on a query


###Params

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








###Example



  
  






