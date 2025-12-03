const {
  withAndroidManifest,
  withMainActivity,
} = require("@expo/config-plugins");

function withAndroidShareIntent(config) {
  config = withShareIntentFilter(config);
  config = withShareHandling(config);
  return config;
}

function withShareIntentFilter(config) {
  return withAndroidManifest(config, async (mod) => {
    const manifest = mod.modResults;
    const mainApplication = manifest.manifest.application?.[0];

    if (!mainApplication) {
      return mod;
    }

    const mainActivity = mainApplication.activity?.find(
      (activity) => activity.$?.["android:name"] === ".MainActivity"
    );

    if (!mainActivity) {
      return mod;
    }

    // Ensure intent-filter array exists
    if (!mainActivity["intent-filter"]) {
      mainActivity["intent-filter"] = [];
    }

    // Check if share intent filter already exists
    const hasShareFilter = mainActivity["intent-filter"].some((filter) => {
      const actions = filter.action || [];
      return actions.some(
        (a) => a.$?.["android:name"] === "android.intent.action.SEND"
      );
    });

    if (!hasShareFilter) {
      // Add intent filter for receiving shared text (URLs)
      mainActivity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.SEND" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
        data: [{ $: { "android:mimeType": "text/plain" } }],
      });

      // Add intent filter for receiving shared URLs
      mainActivity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.SEND" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
        data: [{ $: { "android:mimeType": "text/*" } }],
      });

      // Add intent filter for VIEW action (direct URL opening)
      mainActivity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
        ],
        data: [{ $: { "android:scheme": "vidly" } }],
      });
    }

    // Set launch mode to singleTask to handle intents properly
    mainActivity.$["android:launchMode"] = "singleTask";

    return mod;
  });
}

function withShareHandling(config) {
  return withMainActivity(config, async (mod) => {
    const contents = mod.modResults.contents;

    // Check if share handling is already added
    if (contents.includes("handleShareIntent")) {
      return mod;
    }

    let newContents = contents;

    // Add import for Intent if not present
    if (!contents.includes("import android.content.Intent")) {
      const packageMatch = newContents.match(/(package [^\n]+\n)/);
      if (packageMatch) {
        newContents = newContents.replace(
          packageMatch[0],
          `${packageMatch[0]}import android.content.Intent\n`
        );
      }
    }

    // Add getIntent handling in onCreate if not present
    if (!contents.includes("getIntent()?.let { handleShareIntent(it) }")) {
      // Find onCreate method and add share intent handling
      const onCreateMatch = contents.match(
        /(override fun onCreate\(savedInstanceState: Bundle\?\) \{[^}]*super\.onCreate\(savedInstanceState\))/
      );

      if (onCreateMatch) {
        const replacement = `${onCreateMatch[1]}
    getIntent()?.let { handleShareIntent(it) }`;
        newContents = newContents.replace(onCreateMatch[0], replacement);
      }
    }

    // Add onNewIntent override and handleShareIntent function before the last closing brace
    if (!contents.includes("override fun onNewIntent")) {
      const lastBraceIndex = newContents.lastIndexOf("}");
      const insertCode = `
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let { handleShareIntent(it) }
  }

  private fun handleShareIntent(intent: Intent) {
    when (intent.action) {
      Intent.ACTION_SEND -> {
        if (intent.type?.startsWith("text/") == true) {
          intent.getStringExtra(Intent.EXTRA_TEXT)?.let { sharedText ->
            // Extract URL from shared text
            val urlPattern = Regex("https?://[\\\\w\\\\-._~:/?#\\\\[\\\\]@!$&'()*+,;=%]+")
            val matchResult = urlPattern.find(sharedText)
            matchResult?.value?.let { url ->
              // Send URL to React Native via deep link
              val deepLinkIntent = Intent(Intent.ACTION_VIEW)
              deepLinkIntent.data = android.net.Uri.parse("vidly://share?url=\${android.net.Uri.encode(url)}")
              startActivity(deepLinkIntent)
            }
          }
        }
      }
      Intent.ACTION_VIEW -> {
        // Already handled by React Native deep linking
      }
    }
  }

`;
      newContents =
        newContents.slice(0, lastBraceIndex) +
        insertCode +
        newContents.slice(lastBraceIndex);
    }

    mod.modResults.contents = newContents;
    return mod;
  });
}

module.exports = withAndroidShareIntent;
