package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "skill_tree_rule")
public class SkillTreeRuleResponseDto {

    @JacksonXmlProperty(isAttribute = true)
    private Long id;

    @JacksonXmlProperty(localName = "source_question_name")
    private String sourceQuestionName;

    @JacksonXmlProperty(localName = "trigger_value")
    private String triggerValue;

    @JacksonXmlProperty(localName = "target_question_name")
    private String targetQuestionName;
}
