package com.tbread.entity

import kotlinx.serialization.Required
import kotlinx.serialization.Serializable

@Serializable
data class DpsData(val map:MutableMap<String,Double> = mutableMapOf(),@Required var targetName:String = "",var classMap:MutableMap<String,String> = mutableMapOf())

