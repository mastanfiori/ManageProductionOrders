/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/uxap/BlockBase'],
	function(BlockBase) {
	"use strict";

	var InspectionBlock = BlockBase.extend("i2d.mpe.orders.manages1.blocks.InspectionBlock", {
	    metadata: {
	        views: {
	            Collapsed: {
	                viewName: "i2d.mpe.orders.manages1.blocks.InspectionBlock",
	                type: "XML"
	            },
	            Expanded: {
	                viewName: "i2d.mpe.orders.manages1.blocks.InspectionBlock",
	                type: "XML"
	            }
	        }
	    }
	});
	return InspectionBlock;
});