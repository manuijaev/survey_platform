package com.skyworld.survey.dto.request;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JacksonXmlRootElement(localName = "option")
public class QuestionOptionRequest {

    @JacksonXmlProperty(localName = "value")
    @NotBlank
    private String value;

    @JacksonXmlProperty(localName = "label")
    @NotBlank
    private String label;

    @JacksonXmlProperty(localName = "order_index")
    @NotNull
    private Integer orderIndex;
}
