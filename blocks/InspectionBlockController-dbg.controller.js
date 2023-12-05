/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/i2d/mpe/lib/commons1/utils/formatter",
	"sap/ui/model/resource/ResourceModel"

], function(Controller, formatter, ResourceModel) {
	"use strict";

	return Controller.extend("i2d.mpe.orders.manages1.blocks.InspectionBlockController", {
		formatter: formatter,
		
		onInit: function() {
			this.oCommonI18NModel = formatter._i18n;
			if(!this.oCommonI18NModel){
				this.oCommonI18NModel = this.loadI18NFile();

			}
			// Resource model is updated with the commons i18n file.
			this.getView().setModel(this.oCommonI18NModel, "common_i18n");
		},

		loadI18NFile: function() {
			var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
			return new ResourceModel({
				bundleUrl: sI18NFilePath
			});
		},

		getI18NCommonText: function(isKey, aValues) {
			return this.getView().getModel("common_i18n").getResourceBundle().getText(isKey, aValues);
		},

		/** 
		 * Event handler of smart table rebind for the Inspection Lot table.
		 * Applies filters on smart table based on the Manufacturing order number.
		 * @param oEvent
		 *   @member i2d.mpe.orders.manages1.blocks.InspectionBlockController
		 * @public
		 */
		onHandleRebindInspectionLotBlock: function(oEvent) {
			var oModel = this.getView().getModel("DetailModel");
			var oOrderDetailData = oModel.getData();
			this.sOrderId = oOrderDetailData.orderId;
			var oOrderValues = oEvent.getSource().getModel().oData[this.sOrderId];
			var sManufacturingOrder;
			if (oOrderValues) {
				sManufacturingOrder = oOrderValues.ManufacturingOrder;
			}
			if (oOrderDetailData.selectedOrderData && sManufacturingOrder === undefined) {
				sManufacturingOrder = oOrderDetailData.selectedOrderData.ManufacturingOrder;
			}

			var lmBindingParams = oEvent.getParameter("bindingParams");
			var laFilters = lmBindingParams.filters;
			var oFilter = new sap.ui.model.Filter([], true);
			if (sManufacturingOrder) {
				oFilter.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, sManufacturingOrder));
				laFilters.push(oFilter);
			}
		},

		/** 
		 * Event handler of table item press.
		 * Navigates to Inspection lot application using cross app navigation
		 * @param oEvent
		 *  @member i2d.mpe.orders.manages1.blocks.InspectionBlockController
		 * @public
		 */
		handleInspectionLotSelect: function(oEvent) {
			var oCurrentInspection = oEvent.getParameter("listItem").getBindingContext().getObject();
			//var oCurrentInspection = oEvent.getSource().getBindingContext().getObject();
			var oParameters = {
				"InspectionLot": oCurrentInspection.InspectionLot
			};
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "InspectionLot",
					action: "display"
				},
				params: oParameters
			});
		}
	});
});