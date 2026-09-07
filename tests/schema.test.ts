import { describe, expect, it } from "vitest";
import { managementSchema, parseListField, submissionSchema } from "@/lib/schema";

const validSubmission = {
  title: "탄소발자국 계산기",
  shortDescription: "일상 소비 습관으로 하루 탄소 배출량을 계산해요.",
  fullDescription: "교통, 식사, 전자기기 사용 시간을 입력하면 배출량을 계산합니다.",
  creatorName: "환경지킴이 동아리",
  category: "웹사이트",
  tags: "환경, 웹앱",
  coverImageUrl: "",
  motivation: "",
  usageInstructions: "",
  safetyNotes: "",
  technologies: "HTML, CSS",
  launchUrl: "https://example.com/exhibits/carbon-tracker",
  handsOnAvailable: true,
};

describe("submissionSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = submissionSchema.safeParse(validSubmission);
    expect(result.success).toBe(true);
  });

  it("rejects a missing title with a field-specific error", () => {
    const result = submissionSchema.safeParse({ ...validSubmission, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleIssue = result.error.issues.find((i) => i.path[0] === "title");
      expect(titleIssue).toBeDefined();
    }
  });

  it("rejects a missing creator name", () => {
    const result = submissionSchema.safeParse({ ...validSubmission, creatorName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid launch URL scheme", () => {
    const result = submissionSchema.safeParse({
      ...validSubmission,
      launchUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const urlIssue = result.error.issues.find((i) => i.path[0] === "launchUrl");
      expect(urlIssue).toBeDefined();
    }
  });

  it("rejects a missing launch URL", () => {
    const result = submissionSchema.safeParse({ ...validSubmission, launchUrl: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid optional cover image URL but allows an empty one", () => {
    expect(
      submissionSchema.safeParse({ ...validSubmission, coverImageUrl: "not-a-url" }).success
    ).toBe(false);
    expect(submissionSchema.safeParse({ ...validSubmission, coverImageUrl: "" }).success).toBe(
      true
    );
  });

  it("does not accept a status field (submissions are always pending review)", () => {
    expect(Object.keys(submissionSchema.shape)).not.toContain("status");
  });
});

describe("managementSchema", () => {
  it("requires a valid exhibition status in addition to the base fields", () => {
    expect(
      managementSchema.safeParse({ ...validSubmission, status: "on_display" }).success
    ).toBe(true);
    expect(
      managementSchema.safeParse({ ...validSubmission, status: "not_a_status" }).success
    ).toBe(false);
    expect(managementSchema.safeParse({ ...validSubmission }).success).toBe(false);
  });
});

describe("parseListField", () => {
  it("splits, trims, and de-duplicates comma-separated values", () => {
    expect(parseListField("환경, 웹앱 ,환경,  ")).toEqual(["환경", "웹앱"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseListField("")).toEqual([]);
    expect(parseListField("   ")).toEqual([]);
  });
});
