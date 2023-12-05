/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/i2d/mpe/lib/commons1/utils/formatter",
		"sap/ui/model/resource/ResourceModel",
		"sap/m/MessageBox"
	],

	function (Controller, formatter, ResourceModel, MessageBox) {
		"use strict";

		return Controller.extend("i2d.mpe.orders.manages1.blocks.OrderInformationBlockController", {
			formatter: formatter,

			/**
			 * Hook Method called when a controller is instantiated and its View controls (if available) are already created.
			 */
			onInit: function () {
				this.oCommonI18NModel = formatter._i18n;
				if(!this.oCommonI18NModel){
					this.oCommonI18NModel = this.loadI18NFile();
				}
				// Resource model is updated with the commons i18n file.
				this.getView().setModel(this.oCommonI18NModel, "common_i18n");
			},

			/** 
			 * Loads i18n files.
			 * @returns ResourceModel
			 */
			loadI18NFile: function () {
				var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
				return new ResourceModel({
					bundleUrl: sI18NFilePath
				});
			},

			handleLongTextLinkPress: function (oEvent) {

				var sText = this.getView().byId("hiddenTextField").getText();
				MessageBox.information(sText, {
					title: this.getView().getModel("common_i18n").getProperty("ManufOrderLongText")
				});

			},
			
			/*
			// To handle the press event of MRP Controller link
			handleMRPControllerLink: function () {

			},
			*/
			
			/*
			// To handle the press event of WBS Element
			handleWBSElementLink: function () {

			}
			*/
			
		});
	});