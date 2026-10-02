import XCTest

final class BackgroundTests: XCTestCase {
    func testCycle() {
        let game = XCUIApplication(bundleIdentifier: "io.algorstudio.kavehbench")
        XCTAssertTrue(game.state == .runningForeground || game.state == .runningBackground)
        XCUIApplication(bundleIdentifier: "com.apple.Preferences").activate()
        XCTAssertTrue(game.wait(for: .runningBackground, timeout: 10))
        Thread.sleep(forTimeInterval: 3)
        game.activate()
        XCTAssertTrue(game.wait(for: .runningForeground, timeout: 10))
    }
}
