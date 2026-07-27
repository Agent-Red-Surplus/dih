from dih.main import main


def test_main(capsys):
    main()
    captured = capsys.readouterr()
    assert "Hello from dih" in captured.out
