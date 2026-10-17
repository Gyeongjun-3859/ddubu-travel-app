package com.ddubu.travel;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

// 다른 앱(Yandex Go·플레이 스토어)을 '따로 창 묶음'으로 연다.
// Capacitor 기본 처리는 NEW_TASK 없이 열어서, 그 앱 화면이 우리 앱 위에 얹혀 버린다
// → 뚜부트래블로 돌아와도 Yandex Go 화면이 일정을 가리고 닫을 수도 없었다.
@CapacitorPlugin(name = "ExternalAppLauncher")
public class ExternalAppLauncherPlugin extends Plugin {

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        String scheme = url.getScheme();
        if (!"yandextaxi".equals(scheme) && !"market".equals(scheme)) {
            return null; // 나머지는 Capacitor 기본 처리
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, url);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (ActivityNotFoundException e) {
            // 앱이 없으면 웹 쪽 타이머가 플레이 스토어로 보낸다
        }
        return true;
    }
}
