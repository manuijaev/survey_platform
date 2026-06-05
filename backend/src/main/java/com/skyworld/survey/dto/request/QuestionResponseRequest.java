package com.skyworld.survey.dto.request;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "question_response")
public class QuestionResponseRequest {

    @Valid
    @Builder.Default
    @JacksonXmlElementWrapper(localName = "answers")
    @JacksonXmlProperty(localName = "answer")
    private List<ResponseAnswerRequest> answers = new ArrayList<>();
}
