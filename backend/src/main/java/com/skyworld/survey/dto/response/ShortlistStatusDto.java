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
@JacksonXmlRootElement(localName = "shortlist_status")
public class ShortlistStatusDto {

    @JacksonXmlProperty(isAttribute = true, localName = "response_id")
    private Long responseId;

    @JacksonXmlProperty(isAttribute = true, localName = "shortlisted")
    private String shortlisted;

    @JacksonXmlProperty(isAttribute = true, localName = "vault_count")
    private Long vaultCount;
}
