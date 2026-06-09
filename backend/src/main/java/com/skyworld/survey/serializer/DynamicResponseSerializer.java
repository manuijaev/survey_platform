package com.skyworld.survey.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.skyworld.survey.dto.response.CertificateResponseDto;
import com.skyworld.survey.dto.response.CertificatesResponseDto;
import com.skyworld.survey.dto.response.QuestionResponseItemDto;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;

public class DynamicResponseSerializer extends JsonSerializer<QuestionResponseItemDto> {

    @Override
    public void serialize(QuestionResponseItemDto value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeStartObject();
        gen.writeFieldName("response_id");
        gen.writeNumber(value.getResponseId());

        LinkedHashMap<String, String> answers = value.getAnswers() == null ? new LinkedHashMap<>() : value.getAnswers();
        for (var entry : answers.entrySet()) {
            // Skip the "certificates" answer key — certificates are written separately as structured XML below
            if ("certificates".equals(entry.getKey())) continue;
            gen.writeFieldName(entry.getKey());
            gen.writeString(entry.getValue() == null ? "" : entry.getValue());
        }

        List<CertificateResponseDto> certificates = value.getCertificates();
        gen.writeObjectField("certificates", CertificatesResponseDto.builder()
            .certificates(certificates == null ? List.of() : certificates)
            .build());

        gen.writeStringField("date_responded", value.getDateResponded());
        gen.writeEndObject();
    }
}
