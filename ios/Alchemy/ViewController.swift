import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {

    var webView: WKWebView!

    override func loadView() {
        // Allow localStorage and IndexedDB to persist between launches
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()

        // Allow the web app to open links in Safari
        config.preferences.javaScriptCanOpenWindowsAutomatically = false

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        // Match the app background color to avoid flash on launch
        webView.backgroundColor = UIColor(red: 0.176, green: 0.165, blue: 0.149, alpha: 1) // --bark
        webView.scrollView.backgroundColor = webView.backgroundColor
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Load index.html from the bundled Web folder
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") else {
            fatalError("Web/index.html not found in bundle — make sure all web files are added to the Xcode target.")
        }

        // Allow the WebView to read sibling files (app.js, app.css, etc.)
        let webDir = indexURL.deletingLastPathComponent()
        webView.loadFileURL(indexURL, allowingReadAccessTo: webDir)
    }

    // Open external links in Safari, not inside the WebView
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        if navigationAction.navigationType == .linkActivated,
           let url = navigationAction.request.url,
           url.scheme != "file" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }

    // Status bar: light text on dark background
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
}
