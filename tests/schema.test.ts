import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/dictionary";
import { getManagementSchema, getSubmissionSchema, parseListField } from "@/lib/schema";

const dict = getDictionary("ko");
const submissionSchema = getSubmissionSchema(dict);
const managementSchema = getManagementSchema(dict);

// launchUrl/coverImageUrl are deliberately absent here: they depend on the
// chosen launch mode (URL vs. uploaded file) and are validated separately by
// resolveLaunchFields (see tests/formAction.test.ts), not by this schema.
const validSubmission = {
  title: "탄소발자국 계산기",
  shortDescription: "일상 소비 습관으로 하루 탄소 배출량을 계산해요.",
  fullDescription: "교통, 식사, 전자기기 사용 시간을 입력하면 배출량을 계산합니다.",
  creatorName: "환경지킴이 동아리",
  category: "웹사이트",
  tags: "환경, 웹앱",
  motivation: "",
  usageInstructions: "",
  safetyNotes: "",
  technologies: "HTML, CSS",
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

  it("does not accept a launchUrl or coverImageUrl field (resolved separately by mode)", () => {
    expect(Object.keys(submissionSchema.shape)).not.toContain("launchUrl");
    expect(Object.keys(submissionSchema.shape)).not.toContain("coverImageUrl");
  });

  it("does not accept a status field (submissions are always pending review)", () => {
    expect(Object.keys(submissionSchema.shape)).not.toContain("status");
  });

  it("accepts a valid grade or an absent one, but rejects an invalid grade value", () => {
    expect(submissionSchema.safeParse({ ...validSubmission, grade: "G6" }).success).toBe(true);
    expect(submissionSchema.safeParse(validSubmission).success).toBe(true);
    expect(submissionSchema.safeParse({ ...validSubmission, grade: "" }).success).toBe(true);
    expect(submissionSchema.safeParse({ ...validSubmission, grade: "G12" }).success).toBe(false);
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

describe("getSubmissionSchema locale messages", () => {
  it("produces localized error messages matching the requested dictionary", () => {
    const koResult = getSubmissionSchema(getDictionary("ko")).safeParse({
      ...validSubmission,
      title: "",
    });
    const enResult = getSubmissionSchema(getDictionary("en")).safeParse({
      ...validSubmission,
      title: "",
    });
    expect(koResult.success).toBe(false);
    expect(enResult.success).toBe(false);
    if (!koResult.success && !enResult.success) {
      const koMessage = koResult.error.issues.find((i) => i.path[0] === "title")?.message;
      const enMessage = enResult.error.issues.find((i) => i.path[0] === "title")?.message;
      expect(koMessage).toBe(getDictionary("ko").validation.titleMin);
      expect(enMessage).toBe(getDictionary("en").validation.titleMin);
      expect(koMessage).not.toBe(enMessage);
    }
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
