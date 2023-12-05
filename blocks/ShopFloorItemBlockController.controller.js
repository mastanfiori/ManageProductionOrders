/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/i2d/mpe/lib/popovers1/fragments/MaterialController","sap/ui/model/resource/ResourceModel","sap/i2d/mpe/lib/commons1/utils/formatter"],function(C,M,R,f){"use strict";return C.extend("i2d.mpe.orders.manages1.blocks.ShopFloorItemBlockController",{formatter:f,onInit:function(){this.oMaterialPop=new M();var i=this.loadI18NFile();this.getView().setModel(i,"i18n");},loadI18NFile:function(){var i=jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1")+"/"+"i18n/i18n.properties";return new R({bundleUrl:i});},onHandleRebindShopFloorItemTable:function(i){var m=this.getView().getModel("DetailModel");var o=m.getData();this.sOrderId=o.orderId;var O=i.getSource().getModel().oData[this.sOrderId];var s;if(O){s=i.getSource().getModel().oData[this.sOrderId].ManufacturingOrder;}if(o.selectedOrderData&&s===undefined){s=o.selectedOrderData.ManufacturingOrder;}var b=i.getParameter("bindingParams");var F=b.filters;var a=new sap.ui.model.Filter([],true);if(s){a.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder",sap.ui.model.FilterOperator.EQ,s));F.push(a);}},handleMaterialLinkPress:function(e){var c=e.getSource().getBindingContext();var m=c.getModel();var o=this.getView().getBindingContext().getObject();var p=o.ProductionPlant;var s=m.getProperty("Material",c);this.oMaterialPop.openMaterialPopOver(e,this,s,p);},handleSerialNumberLinkPress:function(e){var s=e.getParameter("listItem").getBindingContext().getObject();var p={"SerialNumber":s.SerialNumber,"Material":s.Material};var c=sap.ushell.Container.getService("CrossApplicationNavigation");c.toExternal({target:{semanticObject:"SerialNumber",action:"displayGenealogy"},params:p});},onBeforeRendering:function(){},onAfterRendering:function(){},onExit:function(){},onDataReceivedShopFloorItemTable:function(c){var d=c.getParameters().getParameters().data.results;var s=this.getView().getModel("shopflooritems");if(!d||d.length<1){s.setData([]);}else{s.setData(d);}}});});
