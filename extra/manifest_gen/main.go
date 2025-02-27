package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type TManifest struct {
	Total int64
	Files map[string]TFileinfo
}

type TFileinfo struct {
	Md5  string
	Size int64
}

func main() {
	fmt.Println("Start generating the Manifest file...")
	var Manifest TManifest
	folderPath := "./game"
	fileList := make(map[string]TFileinfo)
	TotalSize := int64(0)
	err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		fmt.Println("Processing:", path)

		relPath, _ := filepath.Rel(folderPath, path)
		relPath = filepath.ToSlash(relPath)

		md5Hash, err := calculateMD5(path)
		if err != nil {
			return err
		}

		fileList[relPath] = TFileinfo{
			Md5:  md5Hash,
			Size: info.Size(),
		}
		TotalSize = TotalSize + info.Size()
		return nil
	})

	if err != nil {
		fmt.Println("error:", err)
		return
	}

	Manifest = TManifest{
		Total: TotalSize,
		Files: fileList,
	}

	manifestFile := filepath.Join(folderPath, "manifest.json")
	file, err := os.Create(manifestFile)
	if err != nil {
		fmt.Println("Unable to create manifest.json:", err)
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "    ")
	if err := encoder.Encode(Manifest); err != nil {
		fmt.Println("Unable to write JSON:", err)
	}

	fmt.Println("The Manifest file has been generated!")
}

type FileMD5 struct{}

func calculateMD5(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}
