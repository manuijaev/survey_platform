package com.skyworld.survey.dto.request;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "skill_tree_rule")
public class SkillTreeRuleRequest {

    @JacksonXmlProperty(localName = "source_question_name")
    @NotBlank
    private String sourceQuestionName;

    @JacksonXmlProperty(localName = "trigger_value")
    @NotBlank
    private String triggerValue;

    @JacksonXmlProperty(localName = "target_question_name")
    @NotBlank
    private String targetQuestionName;
}
