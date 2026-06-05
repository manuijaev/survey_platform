package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JacksonXmlRootElement(localName = "next_question")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NextQuestionResponseDto {

    private QuestionResponseDto question;

    @JacksonXmlProperty(localName = "survey_complete")
    private Boolean surveyComplete;

    private Progress progress;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Progress {
        private Integer answered;
        @JacksonXmlProperty(localName = "total_visible")
        private Integer totalVisible;
    }
}
