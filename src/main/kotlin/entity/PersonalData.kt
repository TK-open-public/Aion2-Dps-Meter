package com.tbread.entity

import kotlinx.serialization.Required
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class PersonalData(
    @Required var job: String = "",
    var dps: Double = 0.0,
    @Transient var amount: Double = 0.0,
    @Required var damageContribution: Double = 0.0,
    @Transient val analyzedData: MutableMap<Int, AnalyzedSkill> = mutableMapOf(),
    val nickname:String
) {
    private fun addDamage(damage: Double) {
        amount += damage
    }

    fun processPdp(pdp: ParsedDamagePacket) {
        addDamage(pdp.getDamage().toDouble())
        if (!analyzedData.containsKey(pdp.getSkillCode1())) {
            val analyzedSkill = AnalyzedSkill(pdp)
            analyzedData[pdp.getSkillCode1()] = analyzedSkill
        }
        val analyzedSkill = analyzedData[pdp.getSkillCode1()]!!
        analyzedSkill.times++
        analyzedSkill.damageAmount += pdp.getDamage()
        if (pdp.isCrit()) analyzedSkill.critTimes++
    }
}