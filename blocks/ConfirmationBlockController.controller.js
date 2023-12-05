/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/resource/ResourceModel","sap/i2d/mpe/lib/commons1/utils/formatter"],function(C,R,f){"use strict";return C.extend("i2d.mpe.orders.manages1.blocks.ConfirmationBlockController",{formatter:f,onInit:function(){this._osmartTable=this.getView().byId("idAllConfirmationTable");this._osmartTable.setIgnoreFromPersonalisation("IsFinalConfirmation");this.oCommonI18NModel=f._i18n;if(!this.oCommonI18NModel){this.oCommonI18NModel=this.loadI18NFile();}this.getView().setModel(this.oCommonI18NModel,"common_i18n");},handleBeforeExport:function(e){var E=e.getParameter("exportSettings");var n=this.getExcelWorkBookParameters("testingScheduledStartTimeFiled",this.getView().getModel("i18n").getResourceBundle().getText("UnitofMeasure"),"ConfirmationUnit","string");E.workbook.columns.push(n);n=this.getExcelWorkBookParameters("testingScheduledEndTimeFiled",this.getView().getModel("i18n").getResourceBundle().getText("EntryDateNew"),"MfgOrderConfirmationEntryDate","date");E.workbook.columns.push(n);n=this.getExcelWorkBookParameters("testingScheduledEndTimeFiledNew",this.getView().getModel("i18n").getResourceBundle().getText("EntryTimeNew"),"MfgOrderConfirmationEntryTime","time");E.workbook.columns.push(n);},getExcelWorkBookParameters:function(i,l,p,t){var e={columnId:i,displayUnit:false,falseValue:undefined,label:l,precision:undefined,property:p,scale:undefined,template:null,textAlign:"End",trueValue:undefined,type:t,unitProperty:undefined,width:""};return e;},loadI18NFile:function(){var i=jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1")+"/"+"i18n/i18n.properties";return new R({bundleUrl:i});},getI18NCommonText:function(i,v){return this.oCommonI18NModel.getResourceBundle().getText(i,v);},onHandleRebindAllConfirmationTable:function(i){var m=this.getView().getModel("DetailModel");var o=m.getData();this.sOrderId=o.orderId;var O=i.getSource().getModel().oData[this.sOrderId];var M;if(O){M=i.getSource().getModel().oData[this.sOrderId].ManufacturingOrder;}if(o.selectedOrderData&&M===undefined){M=o.selectedOrderData.ManufacturingOrder;}var b=i.getParameter("bindingParams");b.parameters.select+=",MfgOrderConfirmationCount";var F=b.filters;var a=new sap.ui.model.Filter([],true);if(M){a.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder",sap.ui.model.FilterOperator.EQ,M));F.push(a);}},handleConfirmationSelect:function(e){var c=e.getParameter("listItem").getBindingContext().getObject();var s=c.MfgOrderConfirmationGroup;var i=c.MfgOrderConfirmationCount;var o=sap.ushell.Container.getService("CrossApplicationNavigation");var p="&/C_ProdOrdConfObjPg(ProductionOrderConfirmation='"+s+"',OperationConfirmationCount='"+i+"')";o.toExternal({target:{shellHash:"#ProductionOrderConfirmation-displayFactSheet"+p}});},onBeforeRendering:function(){},onAfterRendering:function(){},onExit:function(){}});});
