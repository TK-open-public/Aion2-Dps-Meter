package com.tbread.entity

import com.tbread.DpsCalculator
import kotlinx.serialization.Required
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class AnalyzedSkill(
    @Transient val skillCode: Int = 0,
    var damageAmount: Int = 0,
    var critTimes: Int = 0,
    var times: Int = 0,
    @Required val skillName:String
) {
    constructor(pdp:ParsedDamagePacket) : this(pdp.getSkillCode1(),0,0,0,DpsCalculator.SKILL_MAP[pdp.getSkillCode1()] ?: "")
}