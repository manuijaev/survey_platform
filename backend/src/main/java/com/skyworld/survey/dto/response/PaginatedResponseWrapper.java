package com.skyworld.survey.dto.response;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
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
@JacksonXmlRootElement(localName = "question_responses")
public class PaginatedResponseWrapper {

    @JacksonXmlProperty(isAttribute = true, localName = "current_page")
    private Integer currentPage;

    @JacksonXmlProperty(isAttribute = true, localName = "last_page")
    private Integer lastPage;

    @JacksonXmlProperty(isAttribute = true, localName = "page_size")
    private Integer pageSize;

    @JacksonXmlProperty(isAttribute = true, localName = "total_count")
    private Long totalCount;

    @Builder.Default
    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "question_response")
    private List<QuestionResponseItemDto> questionResponses = new ArrayList<>();
}
