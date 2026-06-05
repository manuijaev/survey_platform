package com.skyworld.survey.dto.request;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseAnswerRequest {

    @JacksonXmlProperty(localName = "question_name")
    private String questionName;

    @JacksonXmlProperty(localName = "answer_value")
    private String answerValue;
}
