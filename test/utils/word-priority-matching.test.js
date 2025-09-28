const assert = require("node:assert");
const {
  stringMatchPercentage,
  getWordPriority,
  calculateReportPriorityFromDescription,
} = require("../../src/utils/word-priority-matching");

describe("Word Priority Matching", function () {
  describe("stringMatchPercentage", function () {
    it("given looking for stirng and a string, return it's matching percentage", function () {
      const gunBunPercentage = stringMatchPercentage("gun", "bun");
      const gunWelcomePercentage = stringMatchPercentage("gun", "gun");

      assert.equal(gunBunPercentage, 0.67);
      assert.equal(gunWelcomePercentage, 1);
    });
  });

  describe("getWordPriority", function () {
    it("should calculate word priority based on similarity to crime keywords", function () {
      assert.equal(getWordPriority("gun", "bun"), 93);
      assert.equal(getWordPriority("gun", "welcome"), 0);
      assert.equal(getWordPriority("gun", "gun"), 140);
      assert.equal(getWordPriority("gun", "Bun"), 93);
      assert.equal(getWordPriority("GUN", "Bun"), 93);
    });
  });

  describe("calculateReportPriorityFromDescription", function () {
    it("should calculate report priority based on similarity to crime keywords from words in the description of the report", function () {
      assert.equal(calculateReportPriorityFromDescription("bun"), 93);
      assert.equal(calculateReportPriorityFromDescription("gun"), 140);
      assert.equal(
        calculateReportPriorityFromDescription(
          "I can see a man with a gun, he also has a bomb",
        ),
        429,
      );
      assert.equal(
        calculateReportPriorityFromDescription(
          "I can see a man with a GUN, he ALSO has A BOMB!",
        ),
        429,
      );
      assert.equal(
        calculateReportPriorityFromDescription(
          "I can see a man with a GUN, he ALSO has A BOMB! gun",
        ),
        429,
      );
    });
  });
});
