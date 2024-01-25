package main

import (
	"embed"
	_ "embed"
	"log"
	"os"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed frontend/dist
var assets embed.FS

func constructWindowURL(url string) string {
	return "https://" + url + "/#!action=stream&udid=emulator-5554&player=broadway&ws=wss%3A%2F%2F" + url + "%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3Demulator-5554"
}

func StartEmulator(emulatorResourceURL string) {
	app := application.New(application.Options{
		Name:        "Dashwave Emulator",
		Description: "Dashwave Emulator",
		Assets: application.AssetOptions{
			FS: assets,
		},
	})

	window := app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title: "Dashwave Emulator",
	})

	// Load an external URL
	window.SetURL(constructWindowURL(emulatorResourceURL))
	window.Center()
	window.SetMinSize(300, 490)

	err := app.Run()

	if err != nil {
		log.Fatal(err.Error())
	}
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Need to provide emulator url as the first argument")
	}
	arg := os.Args[1]

	StartEmulator(arg)
}
