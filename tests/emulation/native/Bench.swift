import UIKit
import WebKit

// Simulator-only test host. Production delivery architecture remains undecided.
final class BenchController: UIViewController {
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var prefersStatusBarHidden: Bool { true }
    override func loadView() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.scrollView.isScrollEnabled = false
        view = web
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "--url"), i + 1 < args.count,
              let url = URL(string: args[i + 1]), url.scheme == "http", url.host == "127.0.0.1" else {
            fatalError("A loopback test URL is required")
        }
        web.load(URLRequest(url: url))
    }
}
final class BenchScene: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: scene)
        window.rootViewController = BenchController()
        self.window = window
        window.makeKeyAndVisible()
    }
    func sceneDidEnterBackground(_ scene: UIScene) { NSLog("KavehBench background") }
    func sceneWillEnterForeground(_ scene: UIScene) { NSLog("KavehBench foreground") }
}
@main
final class BenchApp: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "Bench", sessionRole: session.role)
        configuration.delegateClass = BenchScene.self
        return configuration
    }
}
