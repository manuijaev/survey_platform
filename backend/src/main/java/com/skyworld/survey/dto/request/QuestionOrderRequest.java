package com.skyworld.survey.dto.request;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import jakarta.validation.constraints.NotEmpty;
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
@JacksonXmlRootElement(localName = "order")
public class QuestionOrderRequest {

    @NotEmpty
    @Builder.Default
    @JacksonXmlElementWrapper(localName = "questionIds")
    @JacksonXmlProperty(localName = "questionId")
    private List<String> questionIds = new ArrayList<>();
}
