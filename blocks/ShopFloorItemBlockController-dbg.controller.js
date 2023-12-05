/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/i2d/mpe/lib/popovers1/fragments/MaterialController",
	"sap/ui/model/resource/ResourceModel",
	"sap/i2d/mpe/lib/commons1/utils/formatter"], 
	
	function(Controller, MaterialPopOver, ResourceModel,formatter) {
	"use strict";

	return Controller.extend("i2d.mpe.orders.manages1.blocks.ShopFloorItemBlockController", {
		formatter: formatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf  i2d.mpe.orders.manages1.blocks.ConfirmationBlockController
		 */
		onInit: function() {
			this.oMaterialPop = new MaterialPopOver();
			var oI18NModel = this.loadI18NFile();
			this.getView().setModel(oI18NModel, "i18n");
		},
		
		loadI18NFile: function() {
			var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
			return new ResourceModel({
				bundleUrl: sI18NFilePath
			});
		},

		/** 
		 * Event handler of smart table rebind for Confirmations Table.
		 * Applies filters on smart table based on the Manufacturing order number.
		 * @param ioEvent
		 *  @member i2d.mpe.orders.manages1.blocks.ConfirmationBlockController
		 * @public
		 */
		onHandleRebindShopFloorItemTable: function(ioEvent) {
			var oModel = this.getView().getModel("DetailModel");
			var oOrderDetailData = oModel.getData();
			this.sOrderId = oOrderDetailData.orderId;
			var oOrderValues = ioEvent.getSource().getModel().oData[this.sOrderId];
			var sManufacturingOrder;
			if (oOrderValues) {
				sManufacturingOrder = ioEvent.getSource().getModel().oData[this.sOrderId].ManufacturingOrder;
			} 
			if (oOrderDetailData.selectedOrderData && sManufacturingOrder === undefined) {
				sManufacturingOrder = oOrderDetailData.selectedOrderData.ManufacturingOrder;
			}
			var oBindingParams = ioEvent.getParameter("bindingParams");
			var aFilters = oBindingParams.filters;
			var oFilter = new sap.ui.model.Filter([], true);

			if (sManufacturingOrder) {
				oFilter.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, sManufacturingOrder));
				aFilters.push(oFilter);
			}

		},
		
		handleMaterialLinkPress: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext();
			var oModel = oContext.getModel();
			var oCurrentSerialNumber = this.getView().getBindingContext().getObject();
			var sProductionPlant = oCurrentSerialNumber.ProductionPlant;
			var sMaterial = oModel.getProperty("Material", oContext);
			// var sMRPArea = oModel.getProperty("MRPArea", oContext) || sProductionPlant;
			this.oMaterialPop.openMaterialPopOver(oEvent, this, sMaterial, sProductionPlant);
		},
		
		handleSerialNumberLinkPress: function(oEvent) {
			//navigation with hyperlink
			// var oSerialNumber = oEvent.getSource().getBindingContext().getObject();
			//navigation with chevron
			var oSerialNumber = oEvent.getParameter("listItem").getBindingContext().getObject();
			var oParameters = {
				"SerialNumber": oSerialNumber.SerialNumber,
				"Material"    : oSerialNumber.Material
			};
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "SerialNumber",
					action: "displayGenealogy"
				},
				params: oParameters
			});
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onBeforeRendering: function() {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onAfterRendering: function() {},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onExit: function() {},
		
		onDataReceivedShopFloorItemTable: function(oControlEvent) {
			var aData = oControlEvent.getParameters().getParameters().data.results;
			var oShopFloorItemsModel = this.getView().getModel("shopflooritems");
			if (!aData || aData.length < 1) {
				oShopFloorItemsModel.setData([]);
			} else {
				oShopFloorItemsModel.setData(aData);
			}
		}
	});

});