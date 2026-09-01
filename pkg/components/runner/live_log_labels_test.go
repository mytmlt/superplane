package runner

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLiveLogDisplayTextKeepsFullTextWithNewlines(t *testing.T) {
	t.Parallel()

	assert.Equal(t, "echo \"hello\"\nworld", LiveLogDisplayText("\n  echo \"hello\"\nworld  \n"))
	assert.Equal(t, "", LiveLogDisplayText("  \n\t"))

	clone := `git clone --depth 1 "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"`
	assert.Equal(t, clone, LiveLogDisplayText(clone))

	prompt := "You are writing an implementation plan for a SuperPlane Work Order.\nThe repository is the working tree."
	assert.Equal(t, prompt, LiveLogDisplayText(prompt))

	long := strings.Repeat("a", liveLogDisplayTextMaxRunes+10)
	assert.Equal(t, strings.Repeat("a", liveLogDisplayTextMaxRunes), LiveLogDisplayText(long))
}
