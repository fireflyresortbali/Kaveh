package io.algorstudio.kavehbench;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.webkit.*;
import android.net.Uri;
import android.view.View;
import android.util.Log;

// Local test host only. No store build, native bridge, account or player saves.
public class BenchActivity extends Activity {
  private WebView web;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    web = new WebView(this);
    web.getSettings().setJavaScriptEnabled(true);
    web.getSettings().setDomStorageEnabled(true);
    web.getSettings().setAllowFileAccess(false);
    web.getSettings().setAllowContentAccess(false);
    web.setWebViewClient(new WebViewClient());
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onConsoleMessage(ConsoleMessage m) {
        Log.i("KavehBench", m.messageLevel()+": "+m.message()); return true;
      }
    });
    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    setContentView(web);
    String url = getIntent().getStringExtra("url");
    Uri uri = url == null ? null : Uri.parse(url);
    if (uri == null || !"http".equals(uri.getScheme()) || !"127.0.0.1".equals(uri.getHost())) throw new IllegalArgumentException("A loopback test URL is required");
    web.loadUrl(url);
  }
  @Override protected void onPause() { super.onPause(); if(web!=null)web.onPause(); Log.i("KavehBench","onPause"); }
  @Override protected void onResume() { super.onResume(); if(web!=null)web.onResume(); Log.i("KavehBench","onResume"); }
  @Override protected void onDestroy() { if(web!=null){web.destroy();web=null;} super.onDestroy(); }
}
