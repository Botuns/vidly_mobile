const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SHARE_EXTENSION_NAME = "VidlyShareExtension";
const APP_GROUP_IDENTIFIER = "group.com.vidly.app";

function withShareExtension(config) {
  config = withAppGroupEntitlements(config);
  config = withShareExtensionTarget(config);
  config = withShareExtensionFiles(config);
  config = withShareExtensionInfoPlist(config);
  return config;
}

function withAppGroupEntitlements(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [
      APP_GROUP_IDENTIFIER,
    ];
    return mod;
  });
}

function withShareExtensionTarget(config) {
  return withXcodeProject(config, async (mod) => {
    const xcodeProject = mod.modResults;
    const targetName = SHARE_EXTENSION_NAME;
    const bundleId = `${config.ios?.bundleIdentifier}.share-extension`;
    const groupName = targetName;

    // Check if target already exists
    if (xcodeProject.pbxTargetByName(targetName)) {
      return mod;
    }

    // Create PBXNativeTarget
    const target = xcodeProject.addTarget(
      targetName,
      "app_extension",
      targetName,
      bundleId
    );

    // Add build configurations
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key] === "object" &&
        configurations[key].name &&
        configurations[key].buildSettings?.PRODUCT_NAME === `"${targetName}"`
      ) {
        configurations[key].buildSettings = {
          ...configurations[key].buildSettings,
          CLANG_ENABLE_MODULES: "YES",
          CODE_SIGN_STYLE: "Automatic",
          CURRENT_PROJECT_VERSION: "1",
          GENERATE_INFOPLIST_FILE: "YES",
          INFOPLIST_FILE: `${targetName}/Info.plist`,
          INFOPLIST_KEY_CFBundleDisplayName: "Vidly",
          INFOPLIST_KEY_NSHumanReadableCopyright: "",
          IPHONEOS_DEPLOYMENT_TARGET: "15.1",
          LD_RUNPATH_SEARCH_PATHS: [
            "$(inherited)",
            "@executable_path/Frameworks",
            "@executable_path/../../Frameworks",
          ],
          MARKETING_VERSION: "1.0",
          PRODUCT_BUNDLE_IDENTIFIER: bundleId,
          PRODUCT_NAME: "$(TARGET_NAME)",
          SKIP_INSTALL: "YES",
          SWIFT_EMIT_LOC_STRINGS: "YES",
          SWIFT_VERSION: "5.0",
          TARGETED_DEVICE_FAMILY: '"1,2"',
        };
      }
    }

    // Add source files to the target
    const groupKey = xcodeProject.pbxCreateGroup(groupName, groupName);

    // Add files
    const files = ["ShareViewController.swift", `${targetName}.entitlements`];

    files.forEach((fileName) => {
      const filePath = `${targetName}/${fileName}`;
      if (fileName.endsWith(".swift")) {
        xcodeProject.addSourceFile(filePath, { target: target.uuid }, groupKey);
      } else if (fileName.endsWith(".entitlements")) {
        xcodeProject.addFile(filePath, groupKey);
      }
    });

    // Add Info.plist
    xcodeProject.addFile(`${targetName}/Info.plist`, groupKey);

    // Link to main group
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
    xcodeProject.addToPbxGroup(groupKey, mainGroup);

    return mod;
  });
}

function withShareExtensionFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (mod) => {
      const iosPath = path.join(mod.modRequest.projectRoot, "ios");
      const extensionPath = path.join(iosPath, SHARE_EXTENSION_NAME);

      // Create directory if not exists
      if (!fs.existsSync(extensionPath)) {
        fs.mkdirSync(extensionPath, { recursive: true });
      }

      // Write ShareViewController.swift
      const swiftContent = getShareViewControllerSwift();
      fs.writeFileSync(
        path.join(extensionPath, "ShareViewController.swift"),
        swiftContent
      );

      // Write entitlements
      const entitlementsContent = getEntitlementsPlist();
      fs.writeFileSync(
        path.join(extensionPath, `${SHARE_EXTENSION_NAME}.entitlements`),
        entitlementsContent
      );

      // Write Info.plist
      const infoPlistContent = getInfoPlist();
      fs.writeFileSync(
        path.join(extensionPath, "Info.plist"),
        infoPlistContent
      );

      return mod;
    },
  ]);
}

function withShareExtensionInfoPlist(config) {
  return withInfoPlist(config, (mod) => {
    // Add URL types for deep linking from share extension
    if (!mod.modResults.CFBundleURLTypes) {
      mod.modResults.CFBundleURLTypes = [];
    }

    const existingScheme = mod.modResults.CFBundleURLTypes.find((type) =>
      type.CFBundleURLSchemes?.includes("vidly")
    );

    if (!existingScheme) {
      mod.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: ["vidly"],
        CFBundleURLName: config.ios?.bundleIdentifier || "com.vidly.app",
      });
    }

    return mod;
  });
}

function getShareViewControllerSwift() {
  return `import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    
    private let appGroupId = "${APP_GROUP_IDENTIFIER}"
    private let urlScheme = "vidly"
    
    private var containerView: UIView!
    private var titleLabel: UILabel!
    private var urlLabel: UILabel!
    private var downloadButton: UIButton!
    private var cancelButton: UIButton!
    private var loadingIndicator: UIActivityIndicatorView!
    private var sharedUrl: String?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        extractSharedUrl()
    }
    
    private func setupUI() {
        view.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        
        containerView = UIView()
        containerView.backgroundColor = UIColor.systemBackground
        containerView.layer.cornerRadius = 16
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)
        
        let headerLabel = UILabel()
        headerLabel.text = "Save to Vidly"
        headerLabel.font = UIFont.systemFont(ofSize: 20, weight: .bold)
        headerLabel.textAlignment = .center
        headerLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(headerLabel)
        
        titleLabel = UILabel()
        titleLabel.text = "Extracting video..."
        titleLabel.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        titleLabel.textAlignment = .center
        titleLabel.numberOfLines = 2
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(titleLabel)
        
        urlLabel = UILabel()
        urlLabel.font = UIFont.systemFont(ofSize: 13, weight: .regular)
        urlLabel.textColor = .secondaryLabel
        urlLabel.textAlignment = .center
        urlLabel.numberOfLines = 1
        urlLabel.lineBreakMode = .byTruncatingMiddle
        urlLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(urlLabel)
        
        loadingIndicator = UIActivityIndicatorView(style: .medium)
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(loadingIndicator)
        
        downloadButton = UIButton(type: .system)
        downloadButton.setTitle("Download Video", for: .normal)
        downloadButton.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .semibold)
        downloadButton.backgroundColor = UIColor(red: 99/255, green: 102/255, blue: 241/255, alpha: 1)
        downloadButton.setTitleColor(.white, for: .normal)
        downloadButton.layer.cornerRadius = 12
        downloadButton.translatesAutoresizingMaskIntoConstraints = false
        downloadButton.addTarget(self, action: #selector(downloadTapped), for: .touchUpInside)
        containerView.addSubview(downloadButton)
        
        cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .regular)
        cancelButton.setTitleColor(.label, for: .normal)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        containerView.addSubview(cancelButton)
        
        NSLayoutConstraint.activate([
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            containerView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            containerView.widthAnchor.constraint(equalToConstant: 320),
            
            headerLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 24),
            headerLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            headerLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),
            
            loadingIndicator.topAnchor.constraint(equalTo: headerLabel.bottomAnchor, constant: 24),
            loadingIndicator.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            
            titleLabel.topAnchor.constraint(equalTo: loadingIndicator.bottomAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),
            
            urlLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            urlLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            urlLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),
            
            downloadButton.topAnchor.constraint(equalTo: urlLabel.bottomAnchor, constant: 24),
            downloadButton.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            downloadButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),
            downloadButton.heightAnchor.constraint(equalToConstant: 50),
            
            cancelButton.topAnchor.constraint(equalTo: downloadButton.bottomAnchor, constant: 12),
            cancelButton.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            cancelButton.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20),
            cancelButton.heightAnchor.constraint(equalToConstant: 44),
            cancelButton.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -20),
        ])
        
        loadingIndicator.startAnimating()
        downloadButton.isEnabled = false
        downloadButton.alpha = 0.6
    }
    
    private func extractSharedUrl() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            showError("Could not access shared content")
            return
        }
        
        for item in extensionItems {
            guard let attachments = item.attachments else { continue }
            
            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                        DispatchQueue.main.async {
                            if let url = item as? URL {
                                self?.handleUrl(url.absoluteString)
                            } else if let urlString = item as? String {
                                self?.handleUrl(urlString)
                            } else {
                                self?.showError("Could not extract URL")
                            }
                        }
                    }
                    return
                }
                
                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] (item, error) in
                        DispatchQueue.main.async {
                            if let text = item as? String, let url = self?.extractUrl(from: text) {
                                self?.handleUrl(url)
                            } else {
                                self?.showError("No valid URL found")
                            }
                        }
                    }
                    return
                }
            }
        }
        
        showError("No shareable content found")
    }
    
    private func extractUrl(from text: String) -> String? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        
        if let match = matches?.first, let range = Range(match.range, in: text) {
            return String(text[range])
        }
        return nil
    }
    
    private func handleUrl(_ urlString: String) {
        sharedUrl = urlString
        loadingIndicator.stopAnimating()
        
        let platform = detectPlatform(urlString)
        titleLabel.text = platform.isEmpty ? "Video detected" : "\\(platform) video"
        urlLabel.text = urlString
        
        downloadButton.isEnabled = true
        downloadButton.alpha = 1.0
    }
    
    private func detectPlatform(_ url: String) -> String {
        let lowercased = url.lowercased()
        if lowercased.contains("youtube.com") || lowercased.contains("youtu.be") {
            return "YouTube"
        } else if lowercased.contains("tiktok.com") {
            return "TikTok"
        } else if lowercased.contains("instagram.com") {
            return "Instagram"
        } else if lowercased.contains("twitter.com") || lowercased.contains("x.com") {
            return "X"
        } else if lowercased.contains("facebook.com") || lowercased.contains("fb.watch") {
            return "Facebook"
        } else if lowercased.contains("vimeo.com") {
            return "Vimeo"
        }
        return ""
    }
    
    private func showError(_ message: String) {
        loadingIndicator.stopAnimating()
        titleLabel.text = message
        titleLabel.textColor = .systemRed
        downloadButton.isHidden = true
    }
    
    @objc private func downloadTapped() {
        guard let url = sharedUrl else { return }
        
        // Save to app group
        saveToAppGroup(url: url)
        
        // Open main app with the URL
        openMainApp(with: url)
    }
    
    private func saveToAppGroup(url: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return }
        
        let shareData: [String: Any] = [
            "url": url,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        userDefaults.set(shareData, forKey: "pendingDownload")
        userDefaults.synchronize()
    }
    
    private func openMainApp(with url: String) {
        guard let encodedUrl = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let appUrl = URL(string: "\\(urlScheme)://share?url=\\(encodedUrl)") else {
            completeRequest()
            return
        }
        
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(appUrl, options: [:]) { [weak self] _ in
                    self?.completeRequest()
                }
                return
            }
            responder = responder?.next
        }
        
        // Fallback: try using openURL selector
        let selector = sel_registerName("openURL:")
        responder = self
        while responder != nil {
            if responder!.responds(to: selector) {
                responder!.perform(selector, with: appUrl)
                break
            }
            responder = responder?.next
        }
        
        completeRequest()
    }
    
    @objc private func cancelTapped() {
        completeRequest()
    }
    
    private func completeRequest() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
`;
}

function getEntitlementsPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP_IDENTIFIER}</string>
    </array>
</dict>
</plist>`;
}

function getInfoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Save to Vidly</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionAttributes</key>
        <dict>
            <key>NSExtensionActivationRule</key>
            <dict>
                <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
                <integer>1</integer>
                <key>NSExtensionActivationSupportsText</key>
                <true/>
            </dict>
        </dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.share-services</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
    </dict>
</dict>
</plist>`;
}

module.exports = withShareExtension;
