package runner

import "strings"

const (
	LiveLogKindBash       = "bash"
	LiveLogKindPrompt     = "prompt"
	LiveLogKindSetup      = "setup"
	LiveLogKindJavaScript = "javascript"
	LiveLogKindPython     = "python"

	liveLogDisplayTextMaxRunes = 16384
)

// LiveLogDisplayText is the full user-facing command or prompt text: outer
// whitespace trimmed, interior newlines preserved, capped at
// liveLogDisplayTextMaxRunes so a very large body stays bounded. Callers
// carry the result on BrokerCommand.Preview, which flows to the runner and
// back on the live-log cmd_start record; the JSON field name "preview" is an
// external contract with the runner and is not renamed here.
func LiveLogDisplayText(text string) string {
	text = strings.TrimSpace(text)
	runes := []rune(text)
	if len(runes) > liveLogDisplayTextMaxRunes {
		return string(runes[:liveLogDisplayTextMaxRunes])
	}
	return text
}
